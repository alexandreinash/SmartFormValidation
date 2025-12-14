require('dotenv').config();
const { sequelize } = require('./src/sequelize');
const Form = require('./src/models/Form');
const User = require('./src/models/User');

async function fixMissingAccountIds() {
  let transaction;
  try {
    console.log('\n=== Fixing Missing account_id on Forms ===\n');
    
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    transaction = await sequelize.transaction();

    // Find all forms with null account_id
    const formsWithNullAccount = await Form.findAll({
      where: { account_id: null },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role', 'account_id', 'is_account_owner'],
        required: true
      }],
      transaction
    });

    console.log(`Found ${formsWithNullAccount.length} form(s) with null account_id\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const form of formsWithNullAccount) {
      const creator = form.creator;
      
      if (!creator) {
        console.log(`⚠ Form #${form.id} ("${form.title}") has no creator - skipping`);
        skippedCount++;
        continue;
      }

      let newAccountId = null;

      // Determine the correct account_id based on creator
      if (creator.is_account_owner) {
        // Creator is account owner - use their id as account_id
        newAccountId = creator.id;
      } else if (creator.account_id) {
        // Creator belongs to an account - use their account_id
        newAccountId = creator.account_id;
      }

      if (newAccountId) {
        form.account_id = newAccountId;
        await form.save({ transaction });
        console.log(`✓ Fixed form #${form.id} ("${form.title}") - assigned account_id: ${newAccountId} (creator: ${creator.email})`);
        fixedCount++;
      } else {
        console.log(`⚠ Form #${form.id} ("${form.title}") - creator (${creator.email}) has no account - leaving as null`);
        skippedCount++;
      }
    }

    await transaction.commit();

    console.log('\n=== Summary ===');
    console.log(`✓ Fixed: ${fixedCount} form(s)`);
    console.log(`⚠ Skipped: ${skippedCount} form(s)`);
    console.log('\n✅ Migration completed successfully!\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

fixMissingAccountIds();

