/**
 * DMARC Feature - Test & Validation Scripts
 * 
 * Run these functions manually in the Apps Script editor to test
 * the DMARC implementation before using in production.
 */

/**
 * TEST 1: Initialize DMARC_Health sheet
 * Run this first to create the sheet
 */
function test_initializeDmarcSheet() {
  Logger.log('=== TEST 1: Initialize DMARC_Health Sheet ===');
  
  try {
    initializeDmarcHealthTab();
    Logger.log('✓ Sheet initialized successfully');
    Logger.log('Check your spreadsheet for the DMARC_Health tab');
  } catch (e) {
    Logger.log('✗ Error: ' + e.message);
  }
}

/**
 * TEST 2: Check configuration
 * Verify DMARC settings are correct
 */
function test_dmarcConfiguration() {
  Logger.log('=== TEST 2: DMARC Configuration ===');
  
  const enabled = getConfigBoolean('dmarc_enabled', true);
  const label = getConfigValue('dmarc_label', 'Mythoria/DMARC');
  const batchSize = getConfigNumber('dmarc_batch_size', 50);
  const deleteAfter = getConfigBoolean('dmarc_delete_after_processing', true);
  
  Logger.log(`dmarc_enabled: ${enabled}`);
  Logger.log(`dmarc_label: ${label}`);
  Logger.log(`dmarc_batch_size: ${batchSize}`);
  Logger.log(`dmarc_delete_after_processing: ${deleteAfter}`);
  
  if (enabled) {
    Logger.log('✓ DMARC processing is enabled');
  } else {
    Logger.log('⚠ DMARC processing is disabled - enable in Config.js');
  }
}

/**
 * TEST 3: Check Gmail label exists
 * Verify the DMARC label is created
 */
function test_dmarcLabel() {
  Logger.log('=== TEST 3: DMARC Gmail Label ===');
  
  const labelName = getConfigValue('dmarc_label', 'Mythoria/DMARC');
  
  try {
    const label = GmailApp.getUserLabelByName(labelName);
    
    if (label) {
      Logger.log(`✓ Label "${labelName}" exists`);
      
      // Count threads with this label
      const threads = GmailApp.search(`label:${labelName}`, 0, 5);
      Logger.log(`  Found ${threads.length} thread(s) with this label (showing max 5)`);
      
      // Count unread
      const unreadThreads = GmailApp.search(`label:${labelName} is:unread`, 0, 5);
      Logger.log(`  Found ${unreadThreads.length} unread thread(s) (showing max 5)`);
      
    } else {
      Logger.log(`✗ Label "${labelName}" does not exist`);
      Logger.log('  Run: initializeGmailLabels()');
    }
  } catch (e) {
    Logger.log('✗ Error checking label: ' + e.message);
  }
}

/**
 * TEST 4: Test XML parsing with sample data
 * Verify parser works correctly
 */
function test_dmarcParser() {
  Logger.log('=== TEST 4: DMARC Parser ===');
  
  // Minimal valid DMARC XML for testing
  const sampleXml = `<?xml version="1.0"?>
<feedback>
  <report_metadata>
    <org_name>example.com</org_name>
    <report_id>12345</report_id>
    <date_range>
      <begin>1698796800</begin>
      <end>1698883200</end>
    </date_range>
  </report_metadata>
  <policy_published>
    <domain>mythoria.pt</domain>
    <p>none</p>
  </policy_published>
  <record>
    <row>
      <source_ip>1.2.3.4</source_ip>
      <count>100</count>
      <policy_evaluated>
        <disposition>none</disposition>
        <dkim>pass</dkim>
        <spf>pass</spf>
      </policy_evaluated>
    </row>
    <identifiers>
      <header_from>mythoria.pt</header_from>
    </identifiers>
    <auth_results>
      <spf>
        <domain>mythoria.pt</domain>
        <result>pass</result>
      </spf>
      <dkim>
        <domain>mythoria.pt</domain>
        <result>pass</result>
      </dkim>
    </auth_results>
  </record>
</feedback>`;
  
  try {
    const report = parseDmarcReportXml(sampleXml);
    
    if (report) {
      Logger.log('✓ Parser works correctly');
      Logger.log('  Metadata:');
      Logger.log(`    - Org: ${report.metadata.org_name}`);
      Logger.log(`    - Domain: ${report.metadata.domain}`);
      Logger.log(`    - Date: ${report.metadata.end_date}`);
      Logger.log('  Metrics:');
      Logger.log(`    - Total msgs: ${report.metrics.total_msgs}`);
      Logger.log(`    - DMARC pass rate: ${report.metrics.dmarc_pass_rate}%`);
      Logger.log(`    - SPF pass rate: ${report.metrics.spf_aligned_pass_rate}%`);
      Logger.log(`    - DKIM pass rate: ${report.metrics.dkim_aligned_pass_rate}%`);
      
      const health = calculateHealthStatus(report.metrics);
      Logger.log(`  Health: ${health.status} - ${health.note}`);
      
    } else {
      Logger.log('✗ Parser returned null');
    }
  } catch (e) {
    Logger.log('✗ Parser error: ' + e.message);
  }
}

/**
 * TEST 5: Test health status calculation
 * Verify health rules work correctly
 */
function test_healthStatusRules() {
  Logger.log('=== TEST 5: Health Status Rules ===');
  
  // Test case 1: Healthy metrics (should be OK)
  const healthyMetrics = {
    total_msgs: 1000,
    dmarc_pass_rate: 99.5,
    spf_aligned_pass_rate: 98.5,
    dkim_aligned_pass_rate: 99.0,
    quarantine_count: 0,
    reject_count: 0
  };
  
  const healthyResult = calculateHealthStatus(healthyMetrics);
  Logger.log(`Test 1 - Healthy: ${healthyResult.status} (expected: OK)`);
  Logger.log(`  Note: ${healthyResult.note}`);
  
  // Test case 2: Rejects present (should be ACTION)
  const rejectsMetrics = {
    total_msgs: 1000,
    dmarc_pass_rate: 95.0,
    spf_aligned_pass_rate: 96.0,
    dkim_aligned_pass_rate: 95.0,
    quarantine_count: 0,
    reject_count: 5
  };
  
  const rejectsResult = calculateHealthStatus(rejectsMetrics);
  Logger.log(`Test 2 - Rejects: ${rejectsResult.status} (expected: ACTION)`);
  Logger.log(`  Note: ${rejectsResult.note}`);
  
  // Test case 3: Low pass rate (should be ACTION)
  const lowPassMetrics = {
    total_msgs: 1000,
    dmarc_pass_rate: 85.0,
    spf_aligned_pass_rate: 86.0,
    dkim_aligned_pass_rate: 85.0,
    quarantine_count: 0,
    reject_count: 0
  };
  
  const lowPassResult = calculateHealthStatus(lowPassMetrics);
  Logger.log(`Test 3 - Low Pass Rate: ${lowPassResult.status} (expected: ACTION)`);
  Logger.log(`  Note: ${lowPassResult.note}`);
  
  // Test case 4: Quarantines present (should be WATCH)
  const quarantineMetrics = {
    total_msgs: 1000,
    dmarc_pass_rate: 95.0,
    spf_aligned_pass_rate: 96.0,
    dkim_aligned_pass_rate: 95.0,
    quarantine_count: 10,
    reject_count: 0
  };
  
  const quarantineResult = calculateHealthStatus(quarantineMetrics);
  Logger.log(`Test 4 - Quarantines: ${quarantineResult.status} (expected: WATCH)`);
  Logger.log(`  Note: ${quarantineResult.note}`);
  
  // Test case 5: Marginal rates (should be WATCH)
  const marginalMetrics = {
    total_msgs: 1000,
    dmarc_pass_rate: 93.0,
    spf_aligned_pass_rate: 92.0,
    dkim_aligned_pass_rate: 94.0,
    quarantine_count: 0,
    reject_count: 0
  };
  
  const marginalResult = calculateHealthStatus(marginalMetrics);
  Logger.log(`Test 5 - Marginal: ${marginalResult.status} (expected: WATCH)`);
  Logger.log(`  Note: ${marginalResult.note}`);
}

/**
 * TEST 6: Dry run - Process DMARC reports without making changes
 * Safe test that won't modify anything
 */
function test_dmarcProcessDryRun() {
  Logger.log('=== TEST 6: DMARC Processor (Dry Run) ===');
  
  // Temporarily enable dry run
  const originalDryRun = getConfigBoolean('dry_run', false);
  
  try {
    // Note: This test reads config but doesn't modify it
    // You need to manually set dry_run = true in Config.js first
    
    if (!originalDryRun) {
      Logger.log('⚠ Warning: dry_run is not enabled in Config.js');
      Logger.log('  Set dry_run = true in Config.js, then re-run this test');
      return;
    }
    
    Logger.log('Dry run enabled - no actual changes will be made');
    
    const metrics = processDmarcReports();
    
    Logger.log('Results:');
    Logger.log(`  Processed: ${metrics.processed}`);
    Logger.log(`  Skipped: ${metrics.skipped}`);
    Logger.log(`  Health rows updated: ${metrics.health_rows_updated}`);
    Logger.log(`  Errors: ${metrics.errors}`);
    
    if (metrics.errors > 0) {
      Logger.log('⚠ Check the Errors sheet for details');
    }
    
  } catch (e) {
    Logger.log('✗ Error: ' + e.message);
  }
}

/**
 * TEST 7: Live processing - Process actual DMARC reports
 * WARNING: This will modify your Gmail and Sheet!
 */
function test_dmarcProcessLive() {
  Logger.log('=== TEST 7: DMARC Processor (LIVE) ===');
  Logger.log('⚠ WARNING: This will process actual messages and update your sheet!');
  
  try {
    const metrics = processDmarcReports();
    
    Logger.log('Results:');
    Logger.log(`  Processed: ${metrics.processed}`);
    Logger.log(`  Skipped: ${metrics.skipped}`);
    Logger.log(`  Health rows updated: ${metrics.health_rows_updated}`);
    Logger.log(`  Errors: ${metrics.errors}`);
    
    if (metrics.health_rows_updated > 0) {
      Logger.log('✓ Check the DMARC_Health sheet for new data');
    }
    
    if (metrics.errors > 0) {
      Logger.log('⚠ Check the Errors sheet for details');
    }
    
    if (metrics.processed === 0) {
      Logger.log('ℹ No DMARC messages to process');
      Logger.log('  Make sure messages are labeled with: ' + getConfigValue('dmarc_label'));
    }
    
  } catch (e) {
    Logger.log('✗ Error: ' + e.message);
  }
}

/**
 * TEST 8: Verify sheet structure
 * Check that DMARC_Health sheet has correct columns
 */
function test_dmarcSheetStructure() {
  Logger.log('=== TEST 8: DMARC_Health Sheet Structure ===');
  
  try {
    const sheet = getOrCreateSheet('DMARC_Health');
    const lastRow = sheet.getLastRow();
    
    if (lastRow === 0) {
      Logger.log('✗ Sheet is empty - run initializeDmarcHealthTab() first');
      return;
    }
    
    // Check headers
    const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    const expectedHeaders = [
      'Date',
      'Domain',
      'Total Messages',
      'DMARC Pass Rate (%)',
      'Quarantine Count',
      'Reject Count',
      'SPF Aligned Pass Rate (%)',
      'DKIM Aligned Pass Rate (%)',
      'Health Status',
      'Health Note'
    ];
    
    let allCorrect = true;
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        Logger.log(`✗ Column ${i + 1} incorrect: "${headers[i]}" (expected: "${expectedHeaders[i]}")`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      Logger.log('✓ All headers correct');
    }
    
    Logger.log(`Sheet has ${lastRow} row(s) (including header)`);
    
    if (lastRow > 1) {
      Logger.log('Sample data rows:');
      const sampleRows = sheet.getRange(2, 1, Math.min(3, lastRow - 1), 10).getValues();
      sampleRows.forEach((row, idx) => {
        Logger.log(`  Row ${idx + 2}: ${row[0]} | ${row[1]} | ${row[8]}`);
      });
    }
    
  } catch (e) {
    Logger.log('✗ Error: ' + e.message);
  }
}

/**
 * RUN ALL TESTS
 * Execute all tests in sequence
 */
function test_runAllTests() {
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('DMARC FEATURE - COMPLETE TEST SUITE');
  Logger.log('═══════════════════════════════════════════════════');
  
  test_dmarcConfiguration();
  Logger.log('');
  
  test_dmarcLabel();
  Logger.log('');
  
  test_dmarcSheetStructure();
  Logger.log('');
  
  test_dmarcParser();
  Logger.log('');
  
  test_healthStatusRules();
  Logger.log('');
  
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('BASIC TESTS COMPLETE');
  Logger.log('');
  Logger.log('To test processing:');
  Logger.log('1. Set dry_run = true in Config.js');
  Logger.log('2. Run: test_dmarcProcessDryRun()');
  Logger.log('3. Set dry_run = false in Config.js');
  Logger.log('4. Run: test_dmarcProcessLive()');
  Logger.log('═══════════════════════════════════════════════════');
}
