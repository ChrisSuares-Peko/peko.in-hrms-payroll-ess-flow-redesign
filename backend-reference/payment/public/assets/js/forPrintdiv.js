function printDiv(invoiceSection) {
    let printContents = document.getElementById(invoiceSection).cloneNode(true);
    let excludedElements = printContents.querySelectorAll('#btnInvoiceCancel, #btnInvoicePrint');
    
    // Remove print button and cancel button from print screen  
    for (var i = 0; i < excludedElements.length; i++) {
      excludedElements[i].remove();
    }
  
    // Creating new window for printing
    let newWindow = window.open('', '_blank');
    let newDocument = newWindow.document;
    newDocument.open();
    let headContents = document.head.innerHTML;
    newDocument.write('<html><head>' + headContents + '</head>');
    // let originalTitle = document.title;
    // newDocument.title = "";
    newDocument.write('<body>');
  
    setTimeout(function() {
      newDocument.body.innerHTML = printContents.innerHTML;
      newDocument.write('</body></html>');
      newDocument.close();
  
      newWindow.onload = function() {
        newWindow.print();
        newWindow.close();
      };
    }, 100);
  }



