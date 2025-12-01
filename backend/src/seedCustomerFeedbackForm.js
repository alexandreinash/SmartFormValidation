const Form = require('./models/Form');
const FormField = require('./models/FormField');
const User = require('./models/User');

/**
 * Simple script to seed a demo "Customer Feedback Form".
 * Run once after migrations:
 *   node src/seedCustomerFeedbackForm.js
 */
async function seed() {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('No admin user found. Create an admin account first.');
      return;
    }

    const [form, created] = await Form.findOrCreate({
      where: { title: 'Customer Feedback Form' },
      defaults: {
        created_by: admin.id,
      },
    });

    if (!created) {
      console.log('Customer Feedback Form already exists with id', form.id);
      return;
    }

    const fields = [
      {
        label: 'Full Name',
        type: 'text',
        is_required: true,
        ai_validation_enabled: true,
        expected_entity: 'person',
        expected_sentiment: 'any',
      },
      {
        label: 'Email Address',
        type: 'email',
        is_required: true,
        ai_validation_enabled: false,
        expected_entity: 'none',
        expected_sentiment: 'any',
      },
      {
        label: 'Contact Number',
        type: 'number',
        is_required: false,
        ai_validation_enabled: false,
        expected_entity: 'none',
        expected_sentiment: 'any',
      },
      {
        label: 'Subject',
        type: 'text',
        is_required: true,
        ai_validation_enabled: false,
        expected_entity: 'none',
        expected_sentiment: 'any',
      },
      {
        label: 'Feedback Type',
        type: 'text',
        is_required: true,
        ai_validation_enabled: false,
        expected_entity: 'none',
        expected_sentiment: 'any',
      },
      {
        label: 'Feedback Description',
        type: 'textarea',
        is_required: true,
        ai_validation_enabled: true,
        expected_entity: 'none',
        expected_sentiment: 'neutral',
      },
      {
        label: 'Organization / Company (optional)',
        type: 'text',
        is_required: false,
        ai_validation_enabled: true,
        expected_entity: 'organization',
        expected_sentiment: 'any',
      },
      {
        label: 'Additional Comments',
        type: 'textarea',
        is_required: false,
        ai_validation_enabled: false,
        expected_entity: 'none',
        expected_sentiment: 'any',
      },
    ];

    await Promise.all(
      fields.map((f) =>
        FormField.create({
          form_id: form.id,
          label: f.label,
          type: f.type,
          is_required: f.is_required,
          ai_validation_enabled: f.ai_validation_enabled,
          expected_entity: f.expected_entity,
          expected_sentiment: f.expected_sentiment,
        })
      )
    );

    console.log('Customer Feedback Form created with id', form.id);
  } catch (err) {
    console.error('Failed to seed Customer Feedback Form', err);
  }
}

seed().then(() => process.exit(0));


