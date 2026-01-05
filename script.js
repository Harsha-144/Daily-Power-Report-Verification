// Helper function to extract integer values from text using regex
function getInt(pattern, text, name) {
    const regex = new RegExp(pattern, 'is');
    const match = text.match(regex);
    if (!match) {
        throw new Error(`${name} not found`);
    }
    return parseInt(match[1].replace(/,/g, ''), 10);
}

// Helper function to extract percentage values from text using regex
function getPct(pattern, text, name) {
    const regex = new RegExp(pattern, 'is');
    const match = text.match(regex);
    if (!match) {
        throw new Error(`${name} % not found`);
    }
    return parseFloat(match[1]);
}

// Main verification function
function verifyReport(text) {
    const errors = [];

    try {
        // -------- WHRS --------
        const whrsGen = getInt(String.raw`WHRS.*?Generation\s*-\s*([\d,]+)`, text, "WHRS Generation");
        const whrsAux = getInt(String.raw`WHRS.*?Aux.*?-\s*([\d,]+)`, text, "WHRS Aux");
        const whrsNet = getInt(String.raw`WHRS.*?Net.*?-\s*([\d,]+)`, text, "WHRS Net");
        const whrsPct = getPct(String.raw`WHRS.*?\(([\d.]+)%\)`, text, "WHRS");

        if (whrsGen - whrsAux !== whrsNet) {
            errors.push("WHRS net generation calculation wrong");
        }

        // -------- CPP --------
        const cppGen = getInt(String.raw`CPP.*?Generation\s*-\s*([\d,]+)`, text, "CPP Generation");
        const cppAux = getInt(String.raw`CPP.*?Aux.*?-\s*([\d,]+)`, text, "CPP Aux");
        const cppNet = getInt(String.raw`CPP.*?Net.*?-\s*([\d,]+)`, text, "CPP Net");
        const cppPct = getPct(String.raw`CPP.*?\(([\d.]+)%\)`, text, "CPP");

        if (cppGen - cppAux !== cppNet) {
            errors.push("CPP net generation calculation wrong");
        }

        // -------- EB --------
        const ebUnits = getInt(String.raw`EB.*?([\d,]+)`, text, "EB Units");
        const ebPct = getPct(String.raw`EB.*?\(([\d.]+)%\)`, text, "EB");

        // -------- TOTAL --------
        const total = getInt(String.raw`Total\s*plant\s*consumed.*?([\d,]+)`, text, "Total plant consumed");

        if (whrsNet + cppNet + ebUnits !== total) {
            errors.push("Total plant consumed units mismatch");
        }

        // -------- PERCENT CHECK --------
        const whrsCalcPct = Math.round((whrsNet / total) * 100 * 100) / 100;
        if (Math.abs(whrsCalcPct - whrsPct) > 0.1) {
            errors.push("WHRS percentage mismatch");
        }

        const cppCalcPct = Math.round((cppNet / total) * 100 * 100) / 100;
        if (Math.abs(cppCalcPct - cppPct) > 0.1) {
            errors.push("CPP percentage mismatch");
        }

        const ebCalcPct = Math.round((ebUnits / total) * 100 * 100) / 100;
        if (Math.abs(ebCalcPct - ebPct) > 0.1) {
            errors.push("EB percentage mismatch");
        }

    } catch (error) {
        errors.push(error.message);
    }

    return errors;
}

// Display results in the UI
function displayResults(errors) {
    const resultSection = document.getElementById('resultSection');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDetails = document.getElementById('resultDetails');

    // Remove previous state classes
    resultSection.classList.remove('success', 'error', 'hidden');

    if (errors.length === 0) {
        // Success state
        resultSection.classList.add('success');
        resultIcon.textContent = '✅';
        resultTitle.textContent = 'REPORT IS CORRECT';
        resultDetails.innerHTML = '<p>All calculations and percentages are verified and correct.</p>';
    } else {
        // Error state
        resultSection.classList.add('error');
        resultIcon.textContent = '❌';
        resultTitle.textContent = 'REPORT IS WRONG';

        let errorHtml = '<p><strong>Reasons:</strong></p><ul class="error-list">';
        errors.forEach(error => {
            errorHtml += `<li>• ${error}</li>`;
        });
        errorHtml += '</ul>';

        resultDetails.innerHTML = errorHtml;
    }

    // Scroll to results smoothly
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update date and time
    function updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const dateTimeString = now.toLocaleString('en-IN', options);
        document.getElementById('dateTimeDisplay').textContent = dateTimeString;
    }

    // Update immediately and then every second
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const verifyBtn = document.getElementById('verifyBtn');
    const reportText = document.getElementById('reportText');

    verifyBtn.addEventListener('click', () => {
        const text = reportText.value.trim();

        if (!text) {
            alert('Please paste your report text before verifying.');
            reportText.focus();
            return;
        }

        // Add loading state
        verifyBtn.classList.add('loading');
        verifyBtn.querySelector('.btn-icon').textContent = '⏳';

        // Simulate async processing for better UX
        setTimeout(() => {
            const errors = verifyReport(text);
            displayResults(errors);

            // Remove loading state
            verifyBtn.classList.remove('loading');
            verifyBtn.querySelector('.btn-icon').textContent = '🔍';
        }, 300);
    });

    // Allow Enter key to submit (with Ctrl/Cmd for multiline)
    reportText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            verifyBtn.click();
        }
    });
});
