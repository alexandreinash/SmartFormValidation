const Form = require('./models/Form');
const FormField = require('./models/FormField');
const User = require('./models/User');

/**
 * Seed ALL example forms for testing Google NLP API
 * Run: node src/seedAllExampleForms.js
 */
async function seed() {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ No admin user found. Create an admin account first.');
      return;
    }

    console.log('🌱 Seeding ALL example forms...\n');

    const forms = [];

    // Form 1: Product Review Form
    const [reviewForm] = await Form.findOrCreate({
      where: { title: 'Product Review Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: reviewForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: reviewForm.id, label: 'Product Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: reviewForm.id, label: 'Your Review', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: reviewForm.id, title: 'Product Review Form', url: `/forms/${reviewForm.id}` });

    // Form 2: Job Application Form
    const [jobForm] = await Form.findOrCreate({
      where: { title: 'Job Application Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: jobForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: jobForm.id, label: 'Full Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: jobForm.id, label: 'Previous Company', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: jobForm.id, label: 'Why do you want this job?', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: jobForm.id, title: 'Job Application Form', url: `/forms/${jobForm.id}` });

    // Form 3: Contact Form
    const [contactForm] = await Form.findOrCreate({
      where: { title: 'Contact Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: contactForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: contactForm.id, label: 'Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: contactForm.id, label: 'Email', type: 'email', is_required: true, ai_validation_enabled: true },
        { form_id: contactForm.id, label: 'Message', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: contactForm.id, title: 'Contact Form', url: `/forms/${contactForm.id}` });

    // Form 4: Event Registration Form
    const [eventForm] = await Form.findOrCreate({
      where: { title: 'Event Registration Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: eventForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: eventForm.id, label: 'Attendee Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: eventForm.id, label: 'Organization', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: eventForm.id, label: 'Special Requests', type: 'textarea', is_required: false, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: eventForm.id, title: 'Event Registration Form', url: `/forms/${eventForm.id}` });

    // Form 5: Customer Survey Form
    const [surveyForm] = await Form.findOrCreate({
      where: { title: 'Customer Survey Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: surveyForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: surveyForm.id, label: 'Age', type: 'number', is_required: true, ai_validation_enabled: false },
        { form_id: surveyForm.id, label: 'Occupation', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: surveyForm.id, label: 'Comments', type: 'textarea', is_required: false, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: surveyForm.id, title: 'Customer Survey Form', url: `/forms/${surveyForm.id}` });

    // Form 6: Complaint Form
    const [complaintForm] = await Form.findOrCreate({
      where: { title: 'Complaint Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: complaintForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: complaintForm.id, label: 'Complaint Title', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: complaintForm.id, label: 'Detailed Complaint', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: complaintForm.id, title: 'Complaint Form', url: `/forms/${complaintForm.id}` });

    // Form 7: Customer Feedback Form (Comprehensive)
    const [feedbackForm] = await Form.findOrCreate({
      where: { title: 'Customer Feedback Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: feedbackForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: feedbackForm.id, label: 'Your Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: feedbackForm.id, label: 'Company Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: feedbackForm.id, label: 'Feedback', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: feedbackForm.id, title: 'Customer Feedback Form', url: `/forms/${feedbackForm.id}` });

    // Form 8: Service Request Form
    const [serviceForm] = await Form.findOrCreate({
      where: { title: 'Service Request Form' },
      defaults: { created_by: admin.id },
    });
    if (!(await FormField.findOne({ where: { form_id: serviceForm.id } }))) {
      await FormField.bulkCreate([
        { form_id: serviceForm.id, label: 'Client Name', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: serviceForm.id, label: 'Company', type: 'text', is_required: true, ai_validation_enabled: true },
        { form_id: serviceForm.id, label: 'Service Description', type: 'textarea', is_required: true, ai_validation_enabled: true },
      ]);
    }
    forms.push({ id: serviceForm.id, title: 'Service Request Form', url: `/forms/${serviceForm.id}` });

    console.log('\n🎉 All forms ready!\n');
    console.log('📋 Available Forms:\n');
    forms.forEach(form => {
      console.log(`  ${form.id}. ${form.title}`);
      console.log(`     URL: http://localhost:5174${form.url}\n`);
    });

    console.log('💡 Test Cases:');
    console.log('  - Positive: "I love this product! It\'s amazing!"');
    console.log('  - Negative: "I hate this! It\'s terrible!" (will be flagged)');
    console.log('  - Invalid Name: "hello123" (will be flagged)');
    console.log('  - Invalid Company: "my company" (will be flagged)');
    console.log('  - Profanity: "This is shit!" (will be flagged)');

  } catch (err) {
    console.error('❌ Failed to seed forms:', err);
  }
}

seed().then(() => process.exit(0));


