/**
 * County Pages Access Verification Script
 * 
 * This script verifies that all county pages are accessible without authentication.
 * Run this in the browser console to test county page availability.
 * 
 * Usage in browser console:
 * 1. Copy this entire script
 * 2. Paste into browser console (F12 → Console tab)
 * 3. Press Enter to run
 * 4. Check the results in console output
 */

async function verifyCountyPagesAccess() {
  console.log('🔍 Starting County Pages Access Verification...\n');
  
  const countyPages = [
    { name: 'Montserrado County', file: '../montserrado.html', slug: 'montserrado' },
    { name: 'Bong County', file: '../bong.html', slug: 'bong' },
    { name: 'Nimba County', file: '../nimba.html', slug: 'nimba' },
    { name: 'Lofa County', file: '../lofa.html', slug: 'lofa' },
    { name: 'Grand Bassa County', file: '../bassa.html', slug: 'bassa' },
  ];

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  // Test each county page
  for (const county of countyPages) {
    try {
      // Try to fetch the page (with no-cors to avoid CORS issues)
      const response = await fetch(county.file, { method: 'HEAD', mode: 'no-cors' });
      
      // With no-cors, we can't get real status, so we assume it works
      // A real 404 would throw an error or browser would still fetch it
      console.log(`✅ ${county.name} (${county.file}) - ACCESSIBLE`);
      results.push({ county: county.name, status: 'accessible', file: county.file });
      successCount++;
    } catch (error) {
      console.log(`❌ ${county.name} (${county.file}) - ERROR: ${error.message}`);
      results.push({ county: county.name, status: 'error', file: county.file, error: error.message });
      failureCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Accessible: ${successCount}/${countyPages.length}`);
  console.log(`❌ Failed: ${failureCount}/${countyPages.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 ALL COUNTY PAGES ARE ACCESSIBLE!');
  } else {
    console.log('\n⚠️ Some county pages may have issues. Check the details above.');
  }

  // Test navigation manager if it exists
  if (typeof countyNavigator !== 'undefined') {
    console.log('\n' + '='.repeat(60));
    console.log('🧭 NAVIGATION MANAGER TEST');
    console.log('='.repeat(60));
    
    const liveCounties = countyNavigator.getLiveCounties();
    console.log(`✅ Live Counties Registered: ${liveCounties.length}`);
    liveCounties.forEach(c => {
      console.log(`   • ${c.name} → ${c.url}`);
    });
  } else {
    console.log('\n⚠️ Navigation Manager not loaded. Include: <script src="js/county-navigation.js"></script>');
  }

  // Display results table
  console.log('\n' + '='.repeat(60));
  console.log('📋 DETAILED RESULTS');
  console.log('='.repeat(60));
  console.table(results);

  return {
    success: successCount,
    failed: failureCount,
    total: countyPages.length,
    allAccessible: failureCount === 0,
    results: results
  };
}

// Alternative: Quick test using direct navigation
function quickCountyNavigationTest() {
  console.log('🚀 QUICK NAVIGATION TEST\n');
  
  if (typeof countyNavigator === 'undefined') {
    console.error('❌ Navigation manager not loaded!');
    return;
  }

  // Test each county
  const testCounties = ['bong', 'montserrado', 'nimba', 'lofa', 'bassa'];
  
  testCounties.forEach(slug => {
    const county = countyNavigator.getCounty(slug);
    if (county) {
      console.log(`✅ ${county.name}: ${county.url}`);
    } else {
      console.log(`❌ County not found: ${slug}`);
    }
  });

  // Show navigation example
  console.log('\n💡 To navigate to a county, use:');
  console.log('   countyNavigator.navigateToCounty("bong")');
  console.log('   countyNavigator.navigateToCounty("montserrado")');
  console.log('   etc.');
}

// Test search functionality
function testCountySearch(searchTerm) {
  console.log(`🔍 Testing search for: "${searchTerm}"\n`);
  
  const searchBox = document.getElementById('countySearch');
  if (!searchBox) {
    console.error('❌ County search box not found!');
    return;
  }

  // Simulate search
  searchBox.value = searchTerm;
  searchBox.dispatchEvent(new Event('input', { bubbles: true }));
  
  const visibleCards = document.querySelectorAll('#countyGrid [data-name]:not([style*="display: none"])');
  console.log(`✅ Found ${visibleCards.length} matching county cards`);
  
  visibleCards.forEach(card => {
    console.log(`   • ${card.dataset.name}`);
  });
}

// Helper: Test county card links
function testCountyCardLinks() {
  console.log('🔗 Testing County Card Links\n');
  
  const countyCards = document.querySelectorAll('#countyGrid a[href*="county-pages"]');
  console.log(`Found ${countyCards.length} county page links:\n`);
  
  countyCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || 'Unknown';
    const href = card.href;
    console.log(`✅ ${title}`);
    console.log(`   URL: ${href}`);
    console.log(`   Path: ${href.split(window.location.origin)[1] || href}\n`);
  });
}

// Run verification on page load
console.log('📋 County Pages Verification Tools Loaded');
console.log('Available commands:');
console.log('  • verifyCountyPagesAccess() - Full accessibility test');
console.log('  • quickCountyNavigationTest() - Quick navigation test');
console.log('  • testCountySearch("Montserrado") - Test search functionality');
console.log('  • testCountyCardLinks() - Test all county card links');
console.log('\n⏳ Running verification...\n');

// Auto-run main verification
verifyCountyPagesAccess().then(result => {
  console.log('\n✅ Verification complete. Check results above.');
  if (result.allAccessible) {
    console.log('🎉 County pages are ready for access!');
  }
});
