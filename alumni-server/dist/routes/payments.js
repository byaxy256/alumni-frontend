// src/routes/payments.ts
import express from 'express';
import db from '../db.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
const router = express.Router();
// --- MTN API Configuration ---
const MTN_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
const MTN_COLLECTION_PRIMARY_KEY = process.env.MTN_COLLECTION_PRIMARY_KEY;
const MTN_API_USER = process.env.MTN_API_USER;
const MTN_API_KEY = process.env.MTN_API_KEY;
// Helper to get an access token from MTN
const getMtnToken = async () => {
    const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');
    const response = await axios.post(`${MTN_BASE_URL}/collection/token/`, {}, {
        headers: {
            'Ocp-Apim-Subscription-Key': MTN_COLLECTION_PRIMARY_KEY,
            'Authorization': `Basic ${credentials}`
        }
    });
    return response.data.access_token;
};
// POST /api/payments/initiate
router.post('/initiate', authenticate, async (req, res) => {
    try {
        const { amount, phone, provider, loanId } = req.body;
        const userId = req.user.id;
        const transactionId = uuidv4(); // A unique ID for this specific transaction attempt
        if (!amount || !phone || !loanId) {
            return res.status(400).json({ error: 'Amount, phone, and loanId are required.' });
        }
        // In a real app, you would add logic for Airtel here. For now, we focus on MTN.
        if (provider !== 'mtn') {
            return res.status(400).json({ error: 'Only MTN payments are supported in this demo.' });
        }
        const token = await getMtnToken();
        // The "callback URL" is where MTN will send the final transaction status.
        // It must be a publicly accessible URL (e.g., using ngrok for local development).
        const callbackUrl = 'https://your-public-callback-url.com/api/payments/callback';
        const paymentPayload = {
            amount: String(amount),
            currency: 'UGX', // Or your country's currency
            externalId: loanId, // Can be used to identify the loan
            payer: {
                partyIdType: 'MSISDN',
                partyId: phone,
            },
            payerMessage: `Payment for Loan #${loanId}`,
            payeeNote: `Alumni Loan Repayment`
        };
        // Make the payment request to MTN
        await axios.post(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, paymentPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Reference-Id': transactionId,
                'X-Target-Environment': 'sandbox',
                'Ocp-Apim-Subscription-Key': MTN_COLLECTION_PRIMARY_KEY,
                'Content-Type': 'application/json',
                'X-Callback-Url': callbackUrl,
            }
        });
        // Store the pending transaction in your database so you can track it
        await db.execute('INSERT INTO payments (transaction_id, loan_id, user_id, amount, status) VALUES (?, ?, ?, ?, ?)', [transactionId, loanId, userId, amount, 'PENDING']);
        res.status(202).json({ message: 'Payment request sent. Please approve on your phone.', transactionId });
    }
    catch (err) {
        console.error("MTN Payment Error:", err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to initiate payment.' });
    }
});
// POST /api/payments/callback
// This is the endpoint that the MTN API will call to notify you of the payment status.
router.post('/callback', async (req, res) => {
    const { financialTransactionId, status } = req.body;
    const transactionId = req.headers['x-reference-id']; // The original UUID we sent
    console.log(`Received callback for ${transactionId}: Status - ${status}`);
    try {
        if (status === 'SUCCESSFUL') {
            // 1. Find the pending payment in your database
            const [paymentRows] = await db.execute("SELECT * FROM payments WHERE transaction_id = ?", [transactionId]);
            const payment = paymentRows[0];
            if (payment && payment.status === 'PENDING') {
                // 2. Update the payment status to SUCCESSFUL
                await db.execute("UPDATE payments SET status = ?, external_ref = ? WHERE id = ?", ['SUCCESSFUL', financialTransactionId, payment.id]);
                // 3. Update the loan's outstanding balance
                await db.execute("UPDATE loans SET outstanding_balance = outstanding_balance - ? WHERE id = ?", [payment.amount, payment.loan_id]);
                console.log(`Successfully processed payment for loan #${payment.loan_id}`);
            }
        }
        else {
            // Update the payment status to FAILED
            await db.execute("UPDATE payments SET status = ? WHERE transaction_id = ?", ['FAILED', transactionId]);
            console.log(`Payment failed for transaction ${transactionId}`);
        }
        // Respond to MTN's server
        res.sendStatus(200);
        return;
    }
    catch (err) {
        console.error("Callback processing error:", err);
        res.sendStatus(500);
        return;
    }
});
// --- NEW: A route to get payment history for a specific loan ---
router.get('/loan/:loanId', authenticate, async (req, res) => {
    try {
        const { loanId } = req.params;
        const userId = req.user.id;
        // Query to get successful payments for a specific loan, ensuring the user owns the loan
        const [rows] = await db.execute(`SELECT p.* FROM payments p JOIN loans l ON p.loan_id = l.id 
             WHERE p.loan_id = ? AND l.student_uid = (SELECT uid FROM users WHERE id = ?) AND p.status = 'SUCCESSFUL'
             ORDER BY p.created_at DESC`, [loanId, userId]);
        res.json(rows);
    }
    catch (err) {
        console.error("Error fetching payment history:", err);
        res.status(500).json({ error: 'Server error' });
    }
});
// --- NEW: The route to generate and download a PDF receipt ---
router.get('/:paymentId/receipt', authenticate, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;
        // Security Check: Fetch payment details and verify the logged-in user owns this payment
        const [paymentRows] = await db.execute(`SELECT p.*, u.full_name, u.email 
             FROM payments p JOIN users u ON p.user_id = u.id 
             WHERE p.id = ? AND p.user_id = ? AND p.status = 'SUCCESSFUL' LIMIT 1`, [paymentId, userId]);
        if (paymentRows.length === 0) {
            return res.status(404).json({ error: 'Receipt not found or you do not have permission to view it.' });
        }
        const payment = paymentRows[0];
        // --- PDF Generation Logic ---
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        // Set headers to trigger a download in the browser
        const filename = `Receipt-Payment-${payment.id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // Pipe the PDF output directly to the HTTP response
        doc.pipe(res);
        // --- Add Content to the PDF ---
        doc.fontSize(20).text('Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('Alumni Aid - Uganda Christian University');
        doc.moveDown(2);
        doc.text(`Receipt ID: PAY-${payment.id}`);
        doc.text(`Payment Date: ${new Date(payment.created_at).toLocaleString()}`);
        doc.moveDown();
        doc.text('Paid By:', { underline: true });
        doc.text(payment.full_name);
        doc.text(payment.email);
        doc.moveDown(2);
        // Table Header
        doc.fontSize(10).text('Description', { continued: true });
        doc.text('Amount', { align: 'right' });
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        // Table Row
        doc.fontSize(12).text(`Payment for Loan #${payment.loan_id}`, { continued: true });
        doc.text(`UGX ${Number(payment.amount).toLocaleString()}`, { align: 'right' });
        doc.moveDown();
        // Total
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Total Paid:', { continued: true });
        doc.text(`UGX ${Number(payment.amount).toLocaleString()}`, { align: 'right' });
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica').text('Thank you for your payment.', { align: 'center' });
        // Finalize the PDF and end the stream
        doc.end();
    }
    catch (err) {
        console.error("Error generating receipt:", err);
        res.status(500).json({ error: 'Failed to generate PDF receipt.' });
    }
});
// POST /api/payments/initialize (For event registrations with MTN/Airtel)
router.post('/initialize', authenticate, async (req, res) => {
    try {
        const { amount, phone, reference, type, description } = req.body;
        const user = req.user || {};
        const userUid = user.uid;
        if (!amount || !reference || !userUid) {
            return res.status(400).json({ message: 'Amount and reference are required.' });
        }
        // Ensure event_payments table exists
        await db.execute(`CREATE TABLE IF NOT EXISTS event_payments (
              id INT AUTO_INCREMENT PRIMARY KEY,
              event_id INT NOT NULL,
              user_uid VARCHAR(64) NOT NULL,
              amount INT NOT NULL,
              method VARCHAR(32) DEFAULT NULL,
              status VARCHAR(16) NOT NULL,
              reference VARCHAR(128) DEFAULT NULL,
              transaction_id VARCHAR(64) DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        // parse event id from reference format 'event-<id>'
        const match = String(reference).match(/^event-(\d+)$/);
        const eventId = match ? Number(match[1]) : null;
        if (!eventId) {
            return res.status(400).json({ message: 'Invalid reference format' });
        }
        const transactionId = uuidv4();
        // Insert as PENDING
        await db.execute('INSERT INTO event_payments (event_id, user_uid, amount, method, status, reference, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [eventId, userUid, Number(amount), type || null, 'PENDING', reference, transactionId]);
        // In a real implementation, you would:
        // 1. Call MTN/Airtel API to initiate payment
        // 2. Get a payment URL or code
        // 3. Return it to the client
        // For now, return success (student will auto-register)
        // In production, implement actual payment provider integration
        res.status(200).json({
            message: 'Payment initialized',
            transactionId,
            status: 'PENDING'
        });
    }
    catch (err) {
        console.error('POST /payments/initialize error:', err);
        res.status(500).json({ message: 'Payment initialization failed' });
    }
});
// POST /api/payments/confirm-event
// Simulate provider callback: mark SUCCESS and auto-register the user for the event
router.post('/confirm-event', authenticate, async (req, res) => {
    try {
        const { reference } = req.body;
        const user = req.user || {};
        const userUid = user.uid;
        const match = String(reference).match(/^event-(\d+)$/);
        const eventId = match ? Number(match[1]) : null;
        if (!eventId || !userUid) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        // Mark last pending payment as SUCCESS
        await db.execute('UPDATE event_payments SET status = ? WHERE event_id = ? AND user_uid = ? AND status = ? ORDER BY id DESC LIMIT 1', ['SUCCESS', eventId, userUid, 'PENDING']);
        // Create registration if not already registered
        await db.execute('INSERT IGNORE INTO event_registrations (event_id, student_uid, registered_at) VALUES (?, ?, NOW())', [eventId, userUid]);
        res.json({ message: 'Payment confirmed and registration completed' });
    }
    catch (err) {
        console.error('POST /payments/confirm-event error:', err);
        res.status(500).json({ message: 'Failed to confirm payment' });
    }
});
export default router;
