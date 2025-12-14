const Form = require('./models/Form');
const FormField = require('./models/FormField');
const User = require('./models/User');

/**
 * Seed multiple example forms for testing Google NLP API
 * Run: node src/seedExampleForms.js
 */
async function seed() {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ No admin user found. Create an admin account first.');
      return;
    }

    console.log('🌱 Seeding example forms...\n');

    // Form 1: Product Review Form
    const [reviewForm, reviewCreated] = await Form.findOrCreate({
      where: { title: 'Product Review Form' },
      defaults: { created_by: admin.id },
    });

    if (reviewCreated) {
      await FormField.bulkCreate([
        {
          form_id: reviewForm.id,
          label: 'Product Name',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: reviewForm.id,
          label: 'Your Review',
          type: 'textarea',
          is_required: true,
          ai_validation_enabled: true,
        },
      ]);
      console.log('✅ Created: Product Review Form (ID:', reviewForm.id + ')');
    } else {
      console.log('⏭️  Product Review Form already exists (ID:', reviewForm.id + ')');
    }

    // Form 2: Job Application Form
    const [jobForm, jobCreated] = await Form.findOrCreate({
      where: { title: 'Job Application Form' },
      defaults: { created_by: admin.id },
    });

    if (jobCreated) {
      await FormField.bulkCreate([
        {
          form_id: jobForm.id,
          label: 'Full Name',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: jobForm.id,
          label: 'Previous Company',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: jobForm.id,
          label: 'Why do you want this job?',
          type: 'textarea',
          is_required: true,
          ai_validation_enabled: true,
        },
      ]);
      console.log('✅ Created: Job Application Form (ID:', jobForm.id + ')');
    } else {
      console.log('⏭️  Job Application Form already exists (ID:', jobForm.id + ')');
    }

    // Form 3: Contact Form
    const [contactForm, contactCreated] = await Form.findOrCreate({
      where: { title: 'Contact Form' },
      defaults: { created_by: admin.id },
    });

    if (contactCreated) {
      await FormField.bulkCreate([
        {
          form_id: contactForm.id,
          label: 'Name',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: contactForm.id,
          label: 'Email',
          type: 'email',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: contactForm.id,
          label: 'Message',
          type: 'textarea',
          is_required: true,
          ai_validation_enabled: true,
        },
      ]);
      console.log('✅ Created: Contact Form (ID:', contactForm.id + ')');
    } else {
      console.log('⏭️  Contact Form already exists (ID:', contactForm.id + ')');
    }

    // Form 4: Event Registration Form
    const [eventForm, eventCreated] = await Form.findOrCreate({
      where: { title: 'Event Registration Form' },
      defaults: { created_by: admin.id },
    });

    if (eventCreated) {
      await FormField.bulkCreate([
        {
          form_id: eventForm.id,
          label: 'Attendee Name',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: eventForm.id,
          label: 'Organization',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: eventForm.id,
          label: 'Special Requests',
          type: 'textarea',
          is_required: false,
          ai_validation_enabled: true,
        },
      ]);
      console.log('✅ Created: Event Registration Form (ID:', eventForm.id + ')');
    } else {
      console.log('⏭️  Event Registration Form already exists (ID:', eventForm.id + ')');
    }

    // Form 5: Survey Form
    const [surveyForm, surveyCreated] = await Form.findOrCreate({
      where: { title: 'Customer Survey Form' },
      defaults: { created_by: admin.id },
    });

    if (surveyCreated) {
      await FormField.bulkCreate([
        {
          form_id: surveyForm.id,
          label: 'Age',
          type: 'number',
          is_required: true,
          ai_validation_enabled: false,
        },
        {
          form_id: surveyForm.id,
          label: 'Occupation',
          type: 'text',
          is_required: true,
          ai_validation_enabled: true,
        },
        {
          form_id: surveyForm.id,
          label: 'Comments',
          type: 'textarea',
          is_required: false,
          ai_validation_enabled: true,
        },
      ]);
      console.log('✅ Created: Customer Survey Form (ID:', surveyForm.id + ')');
    } else {
      console.log('⏭️  Customer Survey Form already exists (ID:', surveyForm.id + ')');
    }

    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Form IDs:');
    console.log('  - Product Review Form:', reviewForm.id);
    console.log('  - Job Application Form:', jobForm.id);
    console.log('  - Contact Form:', contactForm.id);
    console.log('  - Event Registration Form:', eventForm.id);
    console.log('  - Customer Survey Form:', surveyForm.id);
    console.log('\n💡 Test them at: http://localhost:5174/forms/{formId}');

  } catch (err) {
    console.error('❌ Failed to seed forms:', err);
  }
}

seed().then(() => process.exit(0));


