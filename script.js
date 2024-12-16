let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

document.getElementById('pdfInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const arrayBuffer = fileReader.result;
        loadPDF(arrayBuffer);
    };
    fileReader.readAsArrayBuffer(file);
}

function loadPDF(arrayBuffer) {
    pdfjsLib.getDocument(arrayBuffer).promise.then(function(pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        renderPage(currentPage);
    });
}

function renderPage(pageNum) {
    pdfDoc.getPage(pageNum).then(function(page) {
        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({
            canvasContext: ctx,
            viewport: viewport
        });

        // Display current page number
        document.getElementById('pageNumber').value = pageNum;
    });
}

function calculateCurrentPage() {
    const pageNum = parseInt(document.getElementById('pageNumber').value, 10);
    if (pageNum < 1 || pageNum > totalPages) {
        alert('Invalid page number');
        return;
    }

    // Get the page content and extract color information
    pdfDoc.getPage(pageNum).then(function(page) {
        page.getOperatorList().then(function(opList) {
            // Analyze the colors used in the page (this will not give CMYK directly, but we can infer the colors from the page)
            let inkInfo = analyzePageColors(opList);
            displayInkInfo(inkInfo);
        });
    });
}

function analyzePageColors(opList) {
    let inkInfo = {
        Cyan: 0,
        Magenta: 0,
        Yellow: 0,
        Black: 0
    };

    // Here we would analyze the `opList` and extract colors. For this example, we will assume a simple method.
    // Ideally, you would extract colors from the graphics operators in the PDF and match them to CMYK values.
    // We'll use a placeholder logic here (replace with real color analysis logic).
    // For now, assume some random values for the ink usage per page.

    inkInfo.Cyan = Math.random() * 50; // Randomized for demonstration
    inkInfo.Magenta = Math.random() * 50;
    inkInfo.Yellow = Math.random() * 50;
    inkInfo.Black = Math.random() * 50;

    return inkInfo;
}

function displayInkInfo(inkInfo) {
    const tableBody = document.getElementById('inkTableBody');
    tableBody.innerHTML = '';

    for (const color in inkInfo) {
        const row = document.createElement('tr');
        const colorCell = document.createElement('td');
        colorCell.textContent = color;
        const percentageCell = document.createElement('td');
        percentageCell.textContent = inkInfo[color].toFixed(2) + '%';

        row.appendChild(colorCell);
        row.appendChild(percentageCell);
        tableBody.appendChild(row);
    }
}

function calculatePrice() {
    const cartridgePrice = parseFloat(prompt('Enter the cartridge price in USD:'));
    const mileage = parseInt(prompt('Enter the page yield (mileage) of the cartridge:'));

    if (isNaN(cartridgePrice) || isNaN(mileage)) {
        alert('Invalid input');
        return;
    }

    const inkInfo = getCurrentPageInkInfo(); // You'd store the actual ink info from the page analysis
    const totalCost = calculateInkCost(cartridgePrice, mileage, inkInfo);
    displayPrice(totalCost);
}

function getCurrentPageInkInfo() {
    // Retrieve the current page's ink coverage info.
    // In this case, this is just a placeholder for testing.
    return {
        Cyan: 30,
        Magenta: 40,
        Yellow: 20,
        Black: 10
    };
}

function calculateInkCost(cartridgePrice, mileage, inkInfo) {
    let totalCost = 0;

    // Calculate the cost based on ink coverage percentages
    for (const color in inkInfo) {
        const coverage = inkInfo[color] / 100;
        totalCost += (cartridgePrice * coverage) / mileage;
    }

    return totalCost;
}

function displayPrice(cost) {
    const priceResult = document.getElementById('priceResult');
    priceResult.textContent = `Cost for this page: $${cost.toFixed(4)}`;
}

function calculateDocumentPrice() {
    const cartridgePrice = parseFloat(prompt('Enter the cartridge price in USD:'));
    const mileage = parseInt(prompt('Enter the page yield (mileage) of the cartridge:'));

    if (isNaN(cartridgePrice) || isNaN(mileage)) {
        alert('Invalid input');
        return;
    }

    const inkInfo = getCurrentPageInkInfo(); // You'd store the actual ink info for all pages
    const totalCostPerPage = calculateInkCost(cartridgePrice, mileage, inkInfo);
    const totalDocumentCost = totalCostPerPage * totalPages;

    displayDocumentPrice(totalDocumentCost);
}

function displayDocumentPrice(totalCost) {
    const priceResult = document.getElementById('priceResult');
    priceResult.textContent = `Total cost for entire document: $${totalCost.toFixed(4)}`;
}