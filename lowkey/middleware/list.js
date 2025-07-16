// list.js

import Listing from '../models/Listing.js';

function generateIdentifier() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let identifier = '';

  for (let i = 0; i < 3; i++) {
    identifier += letters[Math.floor(Math.random() * letters.length)];
  }

  for (let i = 0; i < 9; i++) {
    identifier += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return identifier;
}

const addIdentifier = async function(req, res, next) {
  try {
    console.log('Middleware: Generating identifier for new listing...');
    let identifier;
    let exists = true;

    while (exists) {
      identifier = generateIdentifier();
      console.log('Attempting to generate unique identifier:', identifier);
      exists = await Listing.exists({ identifier });
      if (exists) {
        console.log('Identifier already exists. Retrying...');
      }
    }

    console.log('Generated Identifier:', identifier);
    req.body.identifier = identifier;
    console.log('Identifier successfully added to request body:', req.body.identifier);
    next();
  } catch (error) {
    console.error('Middleware Error:', error.message);
    res.status(500).json({ message: 'Error generating unique identifier', error: error.message });
  }
}

export { addIdentifier };
