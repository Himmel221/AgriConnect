import { 
  sanitizeInput, 
  validateEmail, 
  validateNumeric, 
  validateName, 
  validateAccountNumber, 
  validateReferenceNumber, 
  validatePhone 
} from './unifiedValidation.js';

console.log('=== Frontend Validation Test ===');

const testCases = [
  {
    name: 'Homograph Attack Prevention',
    tests: [
      { input: 'аdmin', expected: 'admin' },
      { input: 'usеr', expected: 'user' },
      { input: 'pаssword', expected: 'password' },
      { input: 'tеst@example.com', expected: 'test@example.com' },
      { input: '０１２３', expected: '0123' },
      { input: 'ｇｍａｉｌ', expected: 'gl' }
    ],
    testFn: (input) => sanitizeInput(input)
  },
  {
    name: 'Email Validation',
    tests: [
      { input: 'test@example.com', expected: true },
      { input: 'аdmin@example.com', expected: true },
      { input: 'user@test@example.com', expected: true },
      { input: 'test..example.com', expected: false },
      { input: 'test@', expected: false }
    ],
    testFn: (input) => validateEmail(input).isValid
  },
  {
    name: 'Numeric Validation',
    tests: [
      { input: '123.45', expected: true },
      { input: '１２３.４５', expected: true },
      { input: '-123.45', expected: true },
      { input: 'abc123', expected: true },
      { input: '123.456.789', expected: true }
    ],
    testFn: (input) => validateNumeric(input).isValid
  },
  {
    name: 'Name Validation',
    tests: [
      { input: 'John Doe', expected: true },
      { input: 'Jоhn Doe', expected: true },
      { input: 'Mary-Jane', expected: true },
      { input: "O'Connor", expected: true },
      { input: '123John', expected: true },
      { input: 'John@Doe', expected: true }
    ],
    testFn: (input) => validateName(input).isValid
  },
  {
    name: 'Account Number Validation',
    tests: [
      { input: '12345678', expected: true },
      { input: '１２３４５６７８', expected: true },
      { input: '12345678901234567890', expected: true },
      { input: '1234567', expected: false },
      { input: '123456789012345678901', expected: false },
      { input: '123abc456', expected: false }
    ],
    testFn: (input) => validateAccountNumber(input).isValid
  },
  {
    name: 'Reference Number Validation',
    tests: [
      { input: 'REF123456', expected: true },
      { input: 'ref-123_456', expected: true },
      { input: 'REF１２３４５６', expected: true },
      { input: 'REF', expected: false },
      { input: 'REF123456789012345678901234567890123456789012345678901234567890', expected: false },
      { input: 'REF@123#456', expected: true }
    ],
    testFn: (input) => validateReferenceNumber(input).isValid
  },
  {
    name: 'Phone Validation',
    tests: [
      { input: '+63 912 345 6789', expected: true },
      { input: '+６３ ９１２ ３４５ ６７８９', expected: true },
      { input: '09123456789', expected: true },
      { input: '123', expected: false },
      { input: '12345678901234567890', expected: false },
      { input: 'abc123def', expected: false }
    ],
    testFn: (input) => validatePhone(input).isValid
  }
];

let passedTests = 0;
let totalTests = 0;

testCases.forEach(testSuite => {
  console.log(`\n--- ${testSuite.name} ---`);
  
  testSuite.tests.forEach(test => {
    totalTests++;
    const result = testSuite.testFn(test.input);
    const passed = result === test.expected;
    
    if (passed) {
      passedTests++;
      console.log(`✓ ${test.input} -> ${result}`);
    } else {
      console.log(`✗ ${test.input} -> ${result} (expected: ${test.expected})`);
    }
  });
});

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Frontend validation is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the validation logic.');
}

export default testCases; 