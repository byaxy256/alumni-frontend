# School Finance System Integration Guide

## Quick Start

The Alumni Aid system is ready to integrate with your School Finance System. Here's how to connect them.

## Integration Endpoint

**Endpoint:** `POST /api/automated-deductions/process-payment`

**Base URL:** Your deployed Alumni Aid backend (e.g., `https://alumni-aid.ucu.ac.ug`)

**Trigger:** When a student makes ANY payment to the school (tuition, accommodation, fees, etc.)

---

## Implementation Steps

### Step 1: Call the API When Payment is Received

After processing a payment in your Finance System:

```bash
curl -X POST https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "student_uid": "student_123@ucu.ac.ug",
    "payment_amount": 500000,
    "payment_reference": "PAY-2026-02-15-001"
  }'
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `student_uid` | string | ✅ Yes | Student email or UID (unique identifier) |
| `payment_amount` | number | ✅ Yes | Amount paid in UGX (must be > 0) |
| `payment_reference` | string | ⚠️ Optional | Your finance system transaction ID for tracking |

### Step 2: Handle the Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "totalDeducted": 500000,
  "deductions": [
    {
      "loanId": "507f1f77bcf86cd799439011",
      "amount": 500000,
      "previousBalance": 700000,
      "newBalance": 200000,
      "deductionId": "507f1f77bcf86cd799439012"
    }
  ],
  "message": "Deducted UGX 500,000 from loans"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "No active loans found",
  "deducted": 0
}
```

**Error Response (500 Server Error):**
```json
{
  "error": "Failed to process payment deduction"
}
```

---

## Integration Examples

### Example 1: Python (Requests)

```python
import requests
import json

def apply_loan_deduction(student_uid, payment_amount, payment_ref):
    """
    Call Alumni Aid API to deduct payment from loan
    """
    url = "https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment"
    
    payload = {
        "student_uid": student_uid,
        "payment_amount": payment_amount,
        "payment_reference": payment_ref
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        
        if result['success']:
            print(f"✓ Deducted UGX {result['totalDeducted']:,} from loans")
            return result
        else:
            print(f"✗ {result['message']}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error calling Alumni Aid API: {e}")
        return None

# Usage
apply_loan_deduction(
    student_uid="john.doe@ucu.ac.ug",
    payment_amount=500000,
    payment_ref="FIN-2026-02-15-12345"
)
```

### Example 2: PHP

```php
<?php

function applyLoanDeduction($student_uid, $payment_amount, $payment_ref = null) {
    $url = "https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment";
    
    $data = array(
        "student_uid" => $student_uid,
        "payment_amount" => $payment_amount,
        "payment_reference" => $payment_ref
    );
    
    $options = array(
        'http' => array(
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($data),
            'timeout' => 10
        )
    );
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        error_log("Failed to call Alumni Aid API");
        return null;
    }
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        echo "✓ Deducted UGX " . number_format($result['totalDeducted']) . " from loans\n";
        return $result;
    } else {
        echo "✗ " . $result['message'] . "\n";
        return null;
    }
}

// Usage
applyLoanDeduction(
    "john.doe@ucu.ac.ug",
    500000,
    "FIN-2026-02-15-12345"
);

?>
```

### Example 3: JavaScript/Node.js

```javascript
async function applyLoanDeduction(studentUid, paymentAmount, paymentRef = null) {
    const url = "https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment";
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_uid: studentUid,
                payment_amount: paymentAmount,
                payment_reference: paymentRef
            }),
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✓ Deducted UGX ${result.totalDeducted.toLocaleString()} from loans`);
            return result;
        } else {
            console.log(`✗ ${result.message}`);
            return null;
        }
    } catch (error) {
        console.error('Error calling Alumni Aid API:', error);
        return null;
    }
}

// Usage
applyLoanDeduction(
    "john.doe@ucu.ac.ug",
    500000,
    "FIN-2026-02-15-12345"
);
```

### Example 4: Java

```java
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

public class AlumniAidIntegration {
    
    public static void applyLoanDeduction(String studentUid, int paymentAmount, String paymentRef) {
        try {
            URL url = new URL("https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(10000);
            conn.setDoOutput(true);
            
            JSONObject payload = new JSONObject();
            payload.put("student_uid", studentUid);
            payload.put("payment_amount", paymentAmount);
            if (paymentRef != null) {
                payload.put("payment_reference", paymentRef);
            }
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            
            int code = conn.getResponseCode();
            if (code == 200) {
                System.out.println("✓ Loan deduction successful");
            } else {
                System.out.println("✗ Error: HTTP " + code);
            }
            
        } catch (Exception e) {
            System.err.println("Error calling Alumni Aid API: " + e.getMessage());
        }
    }
    
    public static void main(String[] args) {
        applyLoanDeduction(
            "john.doe@ucu.ac.ug",
            500000,
            "FIN-2026-02-15-12345"
        );
    }
}
```

---

## When to Call the Integration

Call the endpoint **immediately after** a payment is successfully processed in your Finance System:

```
Payment Received
       ↓
[Finance System Processes Payment]
       ↓
[Call Alumni Aid API] ← Integration happens here
       ↓
[Store Payment Record]
       ↓
[Student Receives Notification]
```

---

## Best Practices

### 1. Use Unique Payment References
Always include a unique `payment_reference` to prevent duplicate deductions:
```json
{
  "student_uid": "john@ucu.ac.ug",
  "payment_amount": 500000,
  "payment_reference": "FIN-2026-02-15-12345"
}
```

### 2. Error Handling
Implement retry logic for network failures:
```python
import time

for attempt in range(3):
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            break
    except requests.exceptions.RequestException:
        if attempt < 2:
            time.sleep(2 ** attempt)  # Exponential backoff
        else:
            log_error("Failed to apply loan deduction after 3 attempts")
```

### 3. Logging
Log all integration calls for auditing:
```python
def log_deduction(student_uid, amount, reference, success, response):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "student_uid": student_uid,
        "amount": amount,
        "reference": reference,
        "success": success,
        "response": response
    }
    # Store in your audit log
    save_to_audit_log(log_entry)
```

### 4. Validate Student UID
Ensure the student_uid format is consistent:
- Email: `john.doe@ucu.ac.ug`
- UID: `60f7d2a8c1d2e4f8a9b3c5d7`
- Always use the same format

### 5. Handle Edge Cases
```python
def validate_payment(student_uid, amount):
    if not student_uid:
        raise ValueError("student_uid is required")
    if amount <= 0:
        raise ValueError("payment_amount must be > 0")
    if amount > 50_000_000:  # Sanity check
        raise ValueError("payment_amount seems too large")
    return True
```

---

## Troubleshooting

### Issue: "No active loans found"
**Cause:** Student has no active loans
**Solution:** This is normal if student hasn't taken a loan yet. No action needed.

### Issue: Connection timeout
**Cause:** Network connectivity issue
**Solution:** 
- Verify Alumni Aid server is running
- Check firewall rules allow outbound connections
- Implement retry logic with exponential backoff

### Issue: Payment applied twice
**Cause:** Duplicate API calls
**Solution:**
- Always use unique `payment_reference`
- Implement idempotency checks in your system
- Log all API calls

### Issue: Wrong student deducted
**Cause:** Incorrect `student_uid` passed
**Solution:**
- Double-check student UID format
- Verify mapping between Finance System and Alumni Aid UID
- Test with a known student first

---

## Testing Integration

### Test Endpoint (Development)

Use this endpoint for testing without affecting production:

```bash
POST https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment?test=true
```

### Test Scenario

1. **Create test loan** in Alumni Aid dashboard
2. **Call API** with test payment
3. **Verify deduction** in Alumni Aid dashboard

```bash
curl -X POST https://alumni-aid.ucu.ac.ug/api/automated-deductions/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "student_uid": "test.student@ucu.ac.ug",
    "payment_amount": 100000,
    "payment_reference": "TEST-001"
  }'
```

---

## Support & Contact

If you encounter any issues with the integration:

1. **Check the error response** for specific error message
2. **Verify request format** matches documentation
3. **Contact Alumni Aid team** with:
   - Student UID
   - Payment amount & reference
   - Error message
   - Timestamp
   - Request JSON

---

## Security Notes

✅ **Production Checklist:**
- [ ] Use HTTPS only
- [ ] Validate all input data
- [ ] Implement timeout (10 seconds recommended)
- [ ] Log all API calls for audit trail
- [ ] Handle errors gracefully
- [ ] Test thoroughly before going live
- [ ] Monitor integration performance
- [ ] Set up alerts for failure rates

---

## FAQ

**Q: What if the student has no loans?**
A: The API returns `success: false, message: "No active loans found"`. This is normal and not an error.

**Q: Can I send partial payments?**
A: Yes! Send any amount and it will be deducted from the oldest loan first.

**Q: What if payment exceeds all loan balances?**
A: It will deduct from all loans until exhausted. Excess is not credited.

**Q: How often should I call the API?**
A: Call it once per payment, immediately after processing.

**Q: Is the API secure?**
A: Yes, it's HTTPS-secured. Ensure your calls use HTTPS.

**Q: What if my server crashes?**
A: Implement retry logic. The API is idempotent when using unique payment_reference.

**Q: Can I test without a real loan?**
A: Yes, create a test loan in the Alumni Aid dashboard first.

---

## Next Steps

1. ✅ Review this guide
2. ✅ Identify integration point in your Finance System
3. ✅ Write code to call the API
4. ✅ Test with sample data
5. ✅ Deploy to production
6. ✅ Monitor integration performance

**Need help?** Contact the Alumni Aid development team.
