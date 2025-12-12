/**
 * Migration script to assign existing users to accounts
 * - brawler612@gmail.com becomes an account owner (admin)
 * - jushuapeterte@gmail.com becomes a regular user in the same account
 * - All existing forms created by these users are assigned to the account
 */

require('dotenv').config();
const { sequelize } = require('./src/sequelize');
const User = require('./src/models/User');
const Form = require('./src/models/Form');

async function migrate() {
  let transaction;
  try {
    console.log('\n=== Running Account Assignment Migration ===\n');

    // Find or identify the users
    const adminEmail = 'brawler612@gmail.com';
    const userEmail = 'jushuapeterte@gmail.com';

    const adminUser = await User.findOne({ where: { email: adminEmail } });
    const regularUser = await User.findOne({ where: { email: userEmail } });

    if (!adminUser) {
      console.log(`⚠ Admin user with email "${adminEmail}" not found. Skipping migration.`);
      process.exit(0);
    }

    if (!regularUser) {
      console.log(`⚠ Regular user with email "${userEmail}" not found. Skipping migration.`);
      process.exit(0);
    }

    transaction = await sequelize.transaction();

    // Set up the admin user as an account owner
    console.log(`✓ Setting up account ownership for ${adminEmail}`);
    adminUser.is_account_owner = true;
    // The admin user's account_id is their own id
    adminUser.account_id = adminUser.id;
    await adminUser.save({ transaction });

    // Assign the regular user to the admin's account
    console.log(`✓ Assigning ${userEmail} to account owned by ${adminEmail}`);
    regularUser.account_id = adminUser.id;
    await regularUser.save({ transaction });

    // Assign all forms created by the admin to their account
    const adminForms = await Form.findAll({
      where: { created_by: adminUser.id },
      transaction
    });

    console.log(`✓ Assigning ${adminForms.length} form(s) created by ${adminEmail} to their account`);
    for (const form of adminForms) {
      form.account_id = adminUser.id;
      await form.save({ transaction });
    }

    // Assign all forms created by the regular user to the admin's account
    const userForms = await Form.findAll({
      where: { created_by: regularUser.id },
      transaction
    });

    console.log(`✓ Assigning ${userForms.length} form(s) created by ${userEmail} to the account`);
    for (const form of userForms) {
      form.account_id = adminUser.id;
      await form.save({ transaction });
    }

    await transaction.commit();

    console.log('\n✓ Migration completed successfully!\n');
    console.log('Summary:');
    console.log(`  - ${adminEmail} (ID: ${adminUser.id}) is now an account owner`);
    console.log(`  - ${userEmail} (ID: ${regularUser.id}) is now a member of the account`);
    console.log(`  - ${adminForms.length} form(s) from admin are now in the account`);
    console.log(`  - ${userForms.length} form(s) from regular user are now in the account`);
    console.log('');

    process.exit(0);
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('\n✗ Migration failed:');
    console.error(err.message);
    console.log('');
    process.exit(1);
  }
}

// Run the migration
migrate();
