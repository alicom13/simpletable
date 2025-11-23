/**
 * SimpleTable Export Selected Extension v1.0.7
 * Add export selected functionality to SimpleTable
 * Load this AFTER simpletable-global.js
 */

(function() {
    'use strict';
    
    if (typeof SimpleTable === 'undefined') {
        console.warn('SimpleTable core not found. Load simpletable-global.js first.');
        return;
    }

    // Add Export Selected Button to Group
    const originalCreateControls = SimpleTable.prototype.createControls;
    SimpleTable.prototype.createControls = function() {
        originalCreateControls.call(this);
        
        // Add Export Selected button to export group
        const selectedBtn = document.createElement("button");
        selectedBtn.className = "simpletable-export-btn selected";
        selectedBtn.innerHTML = '✓';
        selectedBtn.title = "Export Selected Rows";
        selectedBtn.onclick = () => this.exportSelected();
        
        // Insert ke dalam export group (sebelum CSV button)
        const exportGroup = this.csvBtn.parentNode;
        exportGroup.insertBefore(selectedBtn, this.csvBtn);
    };

    // Add exportSelected method
    SimpleTable.prototype.exportSelected = function() {
        const selectedRows = this.getSelectedRows();
        
        if (selectedRows.length === 0) {
            alert('Tidak ada data yang dipilih! Centang data yang akan diexport.');
            return;
        }
        
        const data = this.getExportData(selectedRows);
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, 'selected-data-' + this.getTimestamp() + '.csv', 'text/csv');
        
        alert('Berhasil export ' + selectedRows.length + ' data terpilih!');
    };

    // Add getSelectedRows method
    SimpleTable.prototype.getSelectedRows = function() {
        const selected = [];
        this.filteredRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                selected.push(row);
            }
        });
        return selected;
    };

    // Add getSelectedIds method
    SimpleTable.prototype.getSelectedIds = function() {
        return this.getSelectedRows().map(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            return checkbox ? checkbox.value : null;
        }).filter(id => id !== null);
    };

    console.log('SimpleTable Export Selected v1.0.7 loaded');
})();
