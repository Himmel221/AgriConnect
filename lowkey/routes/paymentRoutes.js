import express from 'express';
import auth from '../middleware/auth.js';
import PaymentMethod from '../models/PaymentMethod.js';

const router = express.Router();


router.get('/', auth, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.userId })
      .select("bankName accountNumber accountName proofImage addedAt"); 

    if (!paymentMethods.length) {
      return res.status(404).json({ message: "No payment methods found." });
    }

    res.status(200).json({ message: "Fetched payment methods successfully.", paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res.status(500).json({ message: "Error fetching payment methods.", error: error.message });
  }
});


router.post('/', auth, async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, proofImage } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Bank Name, Account Number, and Account Name are required.' });
    }

    const newMethod = new PaymentMethod({ userId: req.userId, bankName, accountNumber, accountName, proofImage });
    await newMethod.save();

    res.status(201).json({ message: 'Payment method added successfully.', newMethod });
  } catch (error) {
    console.error('Error adding payment method:', error.message);
    res.status(500).json({ message: 'Server error while adding payment method.', error: error.message });
  }
});


router.put('/:methodId', auth, async (req, res) => {
  try {
    const { methodId } = req.params;
    const { bankName, accountNumber, accountName, proofImage } = req.body; 

    const method = await PaymentMethod.findById(methodId);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    if (method.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only edit your own payment methods.' });
    }

    if (bankName) method.bankName = bankName;
    if (accountNumber) method.accountNumber = accountNumber;
    if (accountName) method.accountName = accountName; 
    if (proofImage) method.proofImage = proofImage;

    await method.save();
    res.status(200).json({ message: 'Payment method updated successfully.', method });

  } catch (error) {
    console.error('Error updating payment method:', error.message);
    res.status(500).json({ message: 'Error updating payment method.', error: error.message });
  }
});

router.delete('/:methodId', auth, async (req, res) => {
  try {
    const { methodId } = req.params;

    const method = await PaymentMethod.findById(methodId);

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    if (method.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own payment methods.' });
    }

    await method.deleteOne();
    res.status(200).json({ message: 'Payment method deleted successfully.' });

  } catch (error) {
    console.error('Error deleting payment method:', error.message);
    res.status(500).json({ message: 'Error deleting payment method.', error: error.message });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params; 

    const paymentMethods = await PaymentMethod.find({ userId }) 
      .select("bankName accountNumber accountName proofImage addedAt");

    if (!paymentMethods.length) {
      return res.status(404).json({ message: "No payment methods found for this user." });
    }

    res.status(200).json({ message: "Fetched payment methods successfully.", paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res.status(500).json({ message: "Error fetching payment methods.", error: error.message });
  }
});

export default router;
