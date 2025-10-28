// Test phone validation
const PHONE_REGEX = /^(\+62|62|0)[0-9]{9,12}$/;

function testPhone(phone) {
  console.log(`Testing phone: ${phone}`);
  console.log(`Regex test: ${PHONE_REGEX.test(phone)}`);
  console.log(`Length: ${phone.length}`);
  console.log('---');
}

// Test various formats
testPhone('+628123456789');
testPhone('628123456789');
testPhone('08123456789');
testPhone('+6281234567890'); // 12 digits
testPhone('6281234567890');  // 12 digits