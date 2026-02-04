// src/routes/reports.ts
import express from 'express';
import { Loan } from '../models/Loan.js';
import { Payment } from '../models/Payment.js';
import { Donation } from '../models/Donation.js';
import { Disbursement } from '../models/Disbursement.js';
import { SupportRequest } from '../models/SupportRequest.js';
import { AutomatedDeduction } from '../models/AutomatedDeduction.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

const router = express.Router();

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `UGX ${amount.toLocaleString('en-US')}`;
};

// Helper to format date
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-GB');
};

/* =======================
   1. Fund Summary Report
======================= */
router.get('/fund-summary/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    // Calculate total income
    const donations = await Donation.find({ payment_status: 'completed' });
    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    const payments = await Payment.find({ status: { $in: ['completed', 'SUCCESSFUL'] } });
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalIncome = totalDonations + totalPayments;

    // Calculate total expenses
    const disbursements = await Disbursement.find();
    const totalDisbursements = disbursements.reduce((sum, d) => sum + (d.net_amount || 0), 0);

    const supportRequests = await SupportRequest.find({ status: { $in: ['disbursed', 'paid', 'approved', 'active'] } });
    const totalSupport = supportRequests.reduce((sum, s) => sum + (s.amount_requested || 0), 0);

    const totalExpenses = totalDisbursements + totalSupport;

    // Calculate balance
    const netBalance = totalIncome - totalExpenses;

    const reportData = {
      generatedDate: new Date(),
      totalIncome,
      incomeBreakdown: {
        donations: totalDonations,
        loanRepayments: totalPayments,
      },
      totalExpenses,
      expenseBreakdown: {
        loanDisbursements: totalDisbursements,
        supportGrants: totalSupport,
      },
      netBalance,
      activeLoanCount: await Loan.countDocuments({ status: 'active' }),
      pendingApplications: await Loan.countDocuments({ status: 'pending' }),
      totalDonors: await Donation.distinct('donor_uid').then(arr => arr.length),
    };

    if (format === 'json') {
      res.json(reportData);
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=fund-summary-${Date.now()}.pdf`);
      
      doc.pipe(res);

      // Title
      doc.fontSize(20).text('Fund Summary Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(reportData.generatedDate)}`, { align: 'center' });
      doc.moveDown(2);

      // Income Section
      doc.fontSize(16).text('Income Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Income: ${formatCurrency(reportData.totalIncome)}`);
      doc.fontSize(10).text(`  - Donations: ${formatCurrency(reportData.incomeBreakdown.donations)}`);
      doc.text(`  - Loan Repayments: ${formatCurrency(reportData.incomeBreakdown.loanRepayments)}`);
      doc.moveDown(2);

      // Expenses Section
      doc.fontSize(16).text('Expense Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Expenses: ${formatCurrency(reportData.totalExpenses)}`);
      doc.fontSize(10).text(`  - Loan Disbursements: ${formatCurrency(reportData.expenseBreakdown.loanDisbursements)}`);
      doc.text(`  - Support Grants: ${formatCurrency(reportData.expenseBreakdown.supportGrants)}`);
      doc.moveDown(2);

      // Net Balance
      doc.fontSize(16).text('Net Balance', { underline: true });
      doc.moveDown();
      doc.fontSize(14).fillColor(reportData.netBalance >= 0 ? 'green' : 'red')
        .text(formatCurrency(reportData.netBalance));
      doc.fillColor('black');
      doc.moveDown(2);

      // Statistics
      doc.fontSize(16).text('Statistics', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Active Loans: ${reportData.activeLoanCount}`);
      doc.text(`Pending Applications: ${reportData.pendingApplications}`);
      doc.text(`Total Donors: ${reportData.totalDonors}`);

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      // Generate CSV
      const csvData = [
        { Category: 'Total Income', Amount: reportData.totalIncome },
        { Category: '  - Donations', Amount: reportData.incomeBreakdown.donations },
        { Category: '  - Loan Repayments', Amount: reportData.incomeBreakdown.loanRepayments },
        { Category: '', Amount: '' },
        { Category: 'Total Expenses', Amount: reportData.totalExpenses },
        { Category: '  - Loan Disbursements', Amount: reportData.expenseBreakdown.loanDisbursements },
        { Category: '  - Support Grants', Amount: reportData.expenseBreakdown.supportGrants },
        { Category: '', Amount: '' },
        { Category: 'Net Balance', Amount: reportData.netBalance },
        { Category: '', Amount: '' },
        { Category: 'Active Loans', Amount: reportData.activeLoanCount },
        { Category: 'Pending Applications', Amount: reportData.pendingApplications },
        { Category: 'Total Donors', Amount: reportData.totalDonors },
      ];

      const parser = new Parser({ fields: ['Category', 'Amount'] });
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=fund-summary-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Fund summary report error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   2. Income vs Expense Report
======================= */
router.get('/income-expense/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const donations = await Donation.find({ 
      payment_status: 'completed',
      created_at: { $gte: sixMonthsAgo }
    });

    const payments = await Payment.find({ 
      status: { $in: ['completed', 'SUCCESSFUL'] },
      created_at: { $gte: sixMonthsAgo }
    });

    const disbursements = await Disbursement.find({ 
      created_at: { $gte: sixMonthsAgo }
    });

    // Group by month
    const monthlyData: any = {};
    
    const addToMonth = (date: Date | string, category: string, amount: number) => {
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, income: 0, expenses: 0 };
      }
      if (category === 'income') monthlyData[key].income += amount;
      if (category === 'expense') monthlyData[key].expenses += amount;
    };

    donations.forEach(d => addToMonth(d.created_at, 'income', d.amount || 0));
    payments.forEach(p => addToMonth(p.created_at, 'income', p.amount || 0));
    disbursements.forEach(d => addToMonth(d.created_at, 'expense', d.net_amount || 0));

    const reportData = Object.values(monthlyData).sort((a: any, b: any) => 
      a.month.localeCompare(b.month)
    );

    if (format === 'json') {
      res.json({ generatedDate: new Date(), months: reportData });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=income-expense-${Date.now()}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('Income vs Expense Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).text('Monthly Breakdown (Last 6 Months)', { underline: true });
      doc.moveDown();

      reportData.forEach((item: any) => {
        doc.fontSize(10).text(`${item.month}:`);
        doc.text(`  Income: ${formatCurrency(item.income)}`);
        doc.text(`  Expenses: ${formatCurrency(item.expenses)}`);
        doc.text(`  Net: ${formatCurrency(item.income - item.expenses)}`);
        doc.moveDown();
      });

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      const csvData = reportData.map((item: any) => ({
        Month: item.month,
        Income: item.income,
        Expenses: item.expenses,
        Net: item.income - item.expenses,
      }));

      const parser = new Parser({ fields: ['Month', 'Income', 'Expenses', 'Net'] });
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=income-expense-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Income expense report error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   3. Donor List & Contributions
======================= */
router.get('/donors/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    const donations = await Donation.find({ payment_status: 'completed' }).populate('donor_uid');

    // Group by donor
    const donorMap = new Map();
    
    for (const donation of donations) {
      const donorId = donation.donor_uid?.toString() || 'Anonymous';
      const donorName = (donation.donor_uid as any)?.full_name || 'Anonymous Donor';
      
      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          name: donorName,
          email: (donation.donor_uid as any)?.email || 'N/A',
          totalContributions: 0,
          contributionCount: 0,
          lastContribution: donation.created_at,
        });
      }
      
      const donor = donorMap.get(donorId);
      donor.totalContributions += donation.amount || 0;
      donor.contributionCount += 1;
      
      if (new Date(donation.created_at) > new Date(donor.lastContribution)) {
        donor.lastContribution = donation.created_at;
      }
    }

    const donorList = Array.from(donorMap.values()).sort((a, b) => 
      b.totalContributions - a.totalContributions
    );

    if (format === 'json') {
      res.json({ generatedDate: new Date(), totalDonors: donorList.length, donors: donorList });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=donors-${Date.now()}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('Donor List & Contributions', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
      doc.fontSize(10).text(`Total Donors: ${donorList.length}`, { align: 'center' });
      doc.moveDown(2);

      donorList.forEach((donor, index) => {
        doc.fontSize(10).text(`${index + 1}. ${donor.name}`);
        doc.fontSize(8).text(`   Email: ${donor.email}`);
        doc.text(`   Total: ${formatCurrency(donor.totalContributions)}`);
        doc.text(`   Contributions: ${donor.contributionCount}`);
        doc.text(`   Last: ${formatDate(donor.lastContribution)}`);
        doc.moveDown(0.5);
      });

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      const csvData = donorList.map((donor, index) => ({
        Rank: index + 1,
        Name: donor.name,
        Email: donor.email,
        'Total Contributions': donor.totalContributions,
        'Number of Contributions': donor.contributionCount,
        'Last Contribution': formatDate(donor.lastContribution),
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=donors-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Donor report error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   4. Loan Defaulters Report
======================= */
router.get('/defaulters/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    // Get all active loans
    const loans = await Loan.find({ status: 'active' }).populate('student_uid');

    const defaulters = [];
    
    for (const loan of loans) {
      const paymentQuery: any = {
        status: { $in: ['completed', 'SUCCESSFUL'] }
      };
      const loanId = loan._id?.toString();
      if (loanId || loan.sqlId) {
        paymentQuery.$or = [];
        if (loanId) paymentQuery.$or.push({ loan_id: loanId });
        if (loan.sqlId) paymentQuery.$or.push({ loan_sql_id: loan.sqlId });
      }
      const payments = await Payment.find(paymentQuery);

      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const outstanding = (loan.amount || 0) - totalPaid;

      // Check if overdue (simple check - no payment in last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentPayments = payments.filter(p => 
        new Date(p.created_at) > threeMonthsAgo
      );

      if (outstanding > 0 && recentPayments.length === 0) {
        const student = loan.student_uid as any;
        defaulters.push({
          studentName: student?.full_name || 'Unknown',
          accessNumber: student?.meta?.accessNumber || 'N/A',
          email: student?.email || 'N/A',
          phone: student?.phone || 'N/A',
          loanAmount: loan.amount || 0,
          amountPaid: totalPaid,
          outstanding,
          lastPayment: payments.length > 0 ? payments[payments.length - 1].created_at : 'Never',
          loanDate: loan.created_at,
        });
      }
    }

    defaulters.sort((a, b) => b.outstanding - a.outstanding);

    if (format === 'json') {
      res.json({ generatedDate: new Date(), totalDefaulters: defaulters.length, defaulters });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=defaulters-${Date.now()}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('Loan Defaulters Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
      doc.fontSize(10).text(`Total Defaulters: ${defaulters.length}`, { align: 'center' });
      doc.moveDown(2);

      defaulters.forEach((item, index) => {
        doc.fontSize(10).text(`${index + 1}. ${item.studentName} (${item.accessNumber})`);
        doc.fontSize(8).text(`   Email: ${item.email} | Phone: ${item.phone}`);
        doc.text(`   Loan Amount: ${formatCurrency(item.loanAmount)}`);
        doc.text(`   Paid: ${formatCurrency(item.amountPaid)}`);
        doc.text(`   Outstanding: ${formatCurrency(item.outstanding)}`);
        doc.text(`   Last Payment: ${item.lastPayment === 'Never' ? 'Never' : formatDate(item.lastPayment)}`);
        doc.moveDown(0.5);
      });

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      const csvData = defaulters.map((item, index) => ({
        '#': index + 1,
        'Student Name': item.studentName,
        'Access Number': item.accessNumber,
        Email: item.email,
        Phone: item.phone,
        'Loan Amount': item.loanAmount,
        'Amount Paid': item.amountPaid,
        Outstanding: item.outstanding,
        'Last Payment': item.lastPayment === 'Never' ? 'Never' : formatDate(item.lastPayment),
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=defaulters-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Defaulters report error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   5. Disbursements Report
======================= */
router.get('/disbursements/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    const disbursements = await Disbursement.find()
      .populate('student_uid')
      .sort({ created_at: -1 });

    const deductions = await AutomatedDeduction.find()
      .populate('student_uid')
      .sort({ created_at: -1 });

    const reportData = disbursements.map(d => {
      const student = d.student_uid as any;
      return {
        date: formatDate(d.created_at),
        studentName: student?.full_name || 'Unknown',
        accessNumber: student?.meta?.accessNumber || 'N/A',
        amount: d.net_amount || 0,
        type: 'Loan Disbursement',
        reference: d._id.toString().substring(0, 8),
      };
    });

    // Add automated deductions
    deductions.forEach(d => {
      const student = d.student_uid as any;
      reportData.push({
        date: formatDate(d.created_at),
        studentName: student?.full_name || 'Unknown',
        accessNumber: student?.meta?.accessNumber || 'N/A',
        amount: d.amount || 0,
        type: `CHOP Deduction (${d.trigger})`,
        reference: d._id.toString().substring(0, 8),
      });
    });

    reportData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (format === 'json') {
      res.json({ generatedDate: new Date(), totalTransactions: reportData.length, data: reportData });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=disbursements-${Date.now()}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('Disbursements Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
      doc.moveDown(2);

      const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);
      doc.fontSize(12).text(`Total Disbursements: ${formatCurrency(totalAmount)}`);
      doc.fontSize(10).text(`Total Transactions: ${reportData.length}`);
      doc.moveDown(2);

      reportData.forEach((item, index) => {
        doc.fontSize(9).text(`${index + 1}. ${item.date} - ${item.studentName} (${item.accessNumber})`);
        doc.fontSize(8).text(`   Type: ${item.type}`);
        doc.text(`   Amount: ${formatCurrency(item.amount)}`);
        doc.text(`   Ref: ${item.reference}`);
        doc.moveDown(0.3);
      });

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      const csvData = reportData.map((item, index) => ({
        '#': index + 1,
        Date: item.date,
        'Student Name': item.studentName,
        'Access Number': item.accessNumber,
        Type: item.type,
        Amount: item.amount,
        Reference: item.reference,
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=disbursements-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Disbursements report error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   6. Project Performance Report
======================= */
router.get('/project-performance/:format', authenticate, async (req, res) => {
  try {
    const { format } = req.params;

    // Calculate metrics by project type
    const loanMetrics = {
      name: 'Student Loans Program',
      totalApplications: await Loan.countDocuments(),
      approved: await Loan.countDocuments({ status: 'active' }),
      pending: await Loan.countDocuments({ status: 'pending' }),
      rejected: await Loan.countDocuments({ status: 'rejected' }),
      totalDisbursed: 0,
      totalRepaid: 0,
    };

    const loans = await Loan.find({ status: 'active' });
    loanMetrics.totalDisbursed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);

    const loanPayments = await Payment.find({ status: { $in: ['completed', 'SUCCESSFUL'] } });
    loanMetrics.totalRepaid = loanPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const supportMetrics = {
      name: 'Support Grants Program',
      totalApplications: await SupportRequest.countDocuments(),
      approved: await SupportRequest.countDocuments({ status: { $in: ['disbursed', 'paid', 'approved', 'active'] } }),
      pending: await SupportRequest.countDocuments({ status: 'pending' }),
      rejected: await SupportRequest.countDocuments({ status: 'rejected' }),
      totalDisbursed: 0,
    };

    const supports = await SupportRequest.find({ status: { $in: ['disbursed', 'paid', 'approved', 'active'] } });
    supportMetrics.totalDisbursed = supports.reduce((sum, s) => sum + (s.amount_requested || 0), 0);

    const reportData = [loanMetrics, supportMetrics];

    if (format === 'json') {
      res.json({ generatedDate: new Date(), projects: reportData });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=project-performance-${Date.now()}.pdf`);
      
      doc.pipe(res);

      doc.fontSize(20).text('Project Performance Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${formatDate(new Date())}`, { align: 'center' });
      doc.moveDown(2);

      reportData.forEach(project => {
        doc.fontSize(14).text(project.name, { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(`Total Applications: ${project.totalApplications}`);
        doc.text(`Approved: ${project.approved}`);
        doc.text(`Pending: ${project.pending}`);
        doc.text(`Rejected: ${project.rejected}`);
        doc.text(`Total Disbursed: ${formatCurrency(project.totalDisbursed)}`);
        if ('totalRepaid' in project) {
          doc.text(`Total Repaid: ${formatCurrency((project as any).totalRepaid)}`);
        }
        doc.moveDown(2);
      });

      doc.end();
    } else if (format === 'excel' || format === 'csv') {
      const csvData = reportData.map(project => ({
        Project: project.name,
        'Total Applications': project.totalApplications,
        Approved: project.approved,
        Pending: project.pending,
        Rejected: project.rejected,
        'Total Disbursed': project.totalDisbursed,
        'Total Repaid': 'totalRepaid' in project ? project.totalRepaid : 'N/A',
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=project-performance-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format. Use json, pdf, excel, or csv' });
    }
  } catch (error: any) {
    console.error('Project performance report error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
