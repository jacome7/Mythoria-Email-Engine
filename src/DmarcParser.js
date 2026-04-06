/**
 * Mythoria Email Engine - DMARC Parser
 * 
 * Parses DMARC aggregate (RUA) reports in XML format
 * Follows RFC 7489 standard for DMARC reporting
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc7489
 */

/**
 * Parse a DMARC report XML and extract metrics
 * @param {string} xmlContent - Raw XML content
 * @returns {Object|null} Parsed report with metadata and records
 */
function parseDmarcReportXml(xmlContent) {
  try {
    const document = XmlService.parse(xmlContent);
    const root = document.getRootElement();
    
    // Extract report metadata
    const metadata = extractReportMetadata(root);
    
    // Extract all records
    const records = extractRecords(root);
    
    if (records.length === 0) {
      Logger.log('Warning: No records found in DMARC report');
      return null;
    }
    
    // Calculate aggregated metrics
    const metrics = calculateMetrics(records);
    
    return {
      metadata: metadata,
      records: records,
      metrics: metrics
    };
    
  } catch (e) {
    Logger.log(`Error parsing DMARC XML: ${e.message}`);
    logError('DMARC_PARSE_XML', 'Failed to parse DMARC report XML', {
      error: e.message,
      stack: e.stack
    });
    return null;
  }
}

/**
 * Extract report metadata (org, date range, domain)
 * @param {GoogleAppsScript.XML_Service.Element} root 
 * @returns {Object}
 */
function extractReportMetadata(root) {
  try {
    const reportMetadata = root.getChild('report_metadata');
    const policyPublished = root.getChild('policy_published');
    
    // Extract date range
    const dateRange = reportMetadata.getChild('date_range');
    const beginTimestamp = parseInt(dateRange.getChildText('begin') || '0');
    const endTimestamp = parseInt(dateRange.getChildText('end') || '0');
    
    // Convert Unix timestamps to dates
    const beginDate = new Date(beginTimestamp * 1000);
    const endDate = new Date(endTimestamp * 1000);
    
    return {
      org_name: reportMetadata.getChildText('org_name') || 'unknown',
      report_id: reportMetadata.getChildText('report_id') || 'unknown',
      begin_date: beginDate,
      end_date: endDate,
      domain: reportMetadata.getChildText('org_name') || 'unknown',  // Use org_name as the domain for tracking which provider sent the report
      policy: policyPublished.getChildText('p') || 'none'
    };
    
  } catch (e) {
    Logger.log(`Error extracting metadata: ${e.message}`);
    return {
      org_name: 'unknown',
      report_id: 'unknown',
      begin_date: new Date(),
      end_date: new Date(),
      domain: 'unknown',
      policy: 'none'
    };
  }
}

/**
 * Extract all record elements from report
 * @param {GoogleAppsScript.XML_Service.Element} root 
 * @returns {Array<Object>}
 */
function extractRecords(root) {
  const records = [];
  
  try {
    const recordElements = root.getChildren('record');
    
    for (let i = 0; i < recordElements.length; i++) {
      const recordEl = recordElements[i];
      const record = parseRecord(recordEl);
      if (record) {
        records.push(record);
      }
    }
    
  } catch (e) {
    Logger.log(`Error extracting records: ${e.message}`);
  }
  
  return records;
}

/**
 * Parse a single record element
 * @param {GoogleAppsScript.XML_Service.Element} recordEl 
 * @returns {Object|null}
 */
function parseRecord(recordEl) {
  try {
    // Row data
    const row = recordEl.getChild('row');
    const sourceIp = row.getChildText('source_ip') || '';
    const count = parseInt(row.getChildText('count') || '0');
    
    const policyEvaluated = row.getChild('policy_evaluated');
    const disposition = policyEvaluated.getChildText('disposition') || 'none';
    const dkim = policyEvaluated.getChildText('dkim') || 'fail';
    const spf = policyEvaluated.getChildText('spf') || 'fail';
    
    // Identifiers
    const identifiers = recordEl.getChild('identifiers');
    const headerFrom = identifiers ? (identifiers.getChildText('header_from') || '') : '';
    
    // Auth results
    const authResults = recordEl.getChild('auth_results');
    
    // SPF results
    let spfAligned = false;
    let spfResult = 'none';
    const spfEl = authResults ? authResults.getChild('spf') : null;
    if (spfEl) {
      spfResult = spfEl.getChildText('result') || 'none';
      // SPF is aligned if it passes AND the domain matches
      spfAligned = (spfResult === 'pass' && spf === 'pass');
    }
    
    // DKIM results
    let dkimAligned = false;
    let dkimResult = 'none';
    const dkimEl = authResults ? authResults.getChild('dkim') : null;
    if (dkimEl) {
      dkimResult = dkimEl.getChildText('result') || 'none';
      // DKIM is aligned if it passes AND the domain matches
      dkimAligned = (dkimResult === 'pass' && dkim === 'pass');
    }
    
    // DMARC passes if either SPF or DKIM is aligned
    const dmarcPass = spfAligned || dkimAligned;
    
    return {
      source_ip: sourceIp,
      count: count,
      disposition: disposition,
      dmarc_pass: dmarcPass,
      spf_aligned: spfAligned,
      dkim_aligned: dkimAligned,
      header_from: headerFrom
    };
    
  } catch (e) {
    Logger.log(`Error parsing record: ${e.message}`);
    return null;
  }
}

/**
 * Calculate aggregated metrics from records
 * @param {Array<Object>} records 
 * @returns {Object}
 */
function calculateMetrics(records) {
  let totalMsgs = 0;
  let dmarcPassCount = 0;
  let spfAlignedPassCount = 0;
  let dkimAlignedPassCount = 0;
  let quarantineCount = 0;
  let rejectCount = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const count = record.count || 0;
    
    totalMsgs += count;
    
    if (record.dmarc_pass) {
      dmarcPassCount += count;
    }
    
    if (record.spf_aligned) {
      spfAlignedPassCount += count;
    }
    
    if (record.dkim_aligned) {
      dkimAlignedPassCount += count;
    }
    
    if (record.disposition === 'quarantine') {
      quarantineCount += count;
    } else if (record.disposition === 'reject') {
      rejectCount += count;
    }
  }
  
  // Calculate pass rates
  const dmarcPassRate = totalMsgs > 0 ? (dmarcPassCount / totalMsgs * 100) : 0;
  const spfAlignedPassRate = totalMsgs > 0 ? (spfAlignedPassCount / totalMsgs * 100) : 0;
  const dkimAlignedPassRate = totalMsgs > 0 ? (dkimAlignedPassCount / totalMsgs * 100) : 0;
  
  return {
    total_msgs: totalMsgs,
    dmarc_pass_rate: Math.round(dmarcPassRate * 100) / 100, // 2 decimal places
    spf_aligned_pass_rate: Math.round(spfAlignedPassRate * 100) / 100,
    dkim_aligned_pass_rate: Math.round(dkimAlignedPassRate * 100) / 100,
    quarantine_count: quarantineCount,
    reject_count: rejectCount
  };
}

/**
 * Calculate health status based on business rules
 * @param {Object} metrics - Calculated metrics
 * @returns {Object} Health status and note
 */
function calculateHealthStatus(metrics) {
  const {
    dmarc_pass_rate,
    reject_count,
    quarantine_count,
    spf_aligned_pass_rate,
    dkim_aligned_pass_rate
  } = metrics;
  
  // ACTION conditions
  if (reject_count > 0) {
    return {
      status: 'ACTION',
      note: `${reject_count} messages rejected`
    };
  }
  
  if (dmarc_pass_rate < 90) {
    return {
      status: 'ACTION',
      note: `DMARC pass rate ${dmarc_pass_rate}% < 90%`
    };
  }
  
  // WATCH conditions
  if (quarantine_count > 0) {
    return {
      status: 'WATCH',
      note: `${quarantine_count} messages quarantined`
    };
  }
  
  if (dmarc_pass_rate >= 90 && dmarc_pass_rate < 98) {
    return {
      status: 'WATCH',
      note: `DMARC pass rate ${dmarc_pass_rate}% between 90-98%`
    };
  }
  
  if (spf_aligned_pass_rate < 95) {
    return {
      status: 'WATCH',
      note: `SPF aligned ${spf_aligned_pass_rate}% < 95%`
    };
  }
  
  if (dkim_aligned_pass_rate < 95) {
    return {
      status: 'WATCH',
      note: `DKIM aligned ${dkim_aligned_pass_rate}% < 95%`
    };
  }
  
  // OK - all good
  return {
    status: 'OK',
    note: 'All metrics healthy'
  };
}
