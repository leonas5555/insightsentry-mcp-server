#!/usr/bin/env node

/**
 * Test script for session derived tools
 * Tests the new configurable session tools and derived functionality
 */

import { apiTool } from '../tools/insightsentry/insight-sentry/session-infomation.js';
import { 
  marketStatusTool, 
  tradingCalendarTool, 
  executionTimingTool, 
  riskSessionTool 
} from '../tools/insightsentry/insight-sentry/session-derived-tools.js';

// Test configuration
const TEST_SYMBOL = 'NASDAQ:AAPL';

async function testBaseSessionTool() {
  console.log('🧪 Testing Base Session Tool...\n');
  
  // Test basic functionality
  console.log('📊 Basic session data:');
  const basicData = await apiTool.function({ symbol: TEST_SYMBOL });
  console.log('Symbol:', basicData.code);
  console.log('Timezone:', basicData.timezone);
  console.log('Holidays count:', basicData.holidays?.length || 0);
  console.log('Sessions defined:', basicData.details?.length || 0);
  
  // Test optimized functionality
  console.log('\n🎯 Optimized session data:');
  const optimizedData = await apiTool.function({ 
    symbol: TEST_SYMBOL, 
    optimize: true,
    include_historical_holidays: false
  });
  console.log('Symbol:', optimizedData.code);
  console.log('Filtered holidays count:', optimizedData.holidays?.length || 0);
  console.log('Has session lookup maps:', !!optimizedData.sessions?.holiday_set);
  console.log('Shortened dates count:', optimizedData.sessions?.shortened_dates?.size || 0);
  
  return { basicData, optimizedData };
}

async function testDerivedSessionTools() {
  console.log('\n🔧 Testing Derived Session Tools...\n');
  
  // Test market status tool
  console.log('🟢 Market Status Tool:');
  const marketStatus = await marketStatusTool.function({ symbol: TEST_SYMBOL });
  console.log('Market open:', marketStatus.market_status?.is_market_open);
  console.log('Current session:', marketStatus.market_status?.current_session);
  console.log('Is holiday:', marketStatus.market_status?.is_holiday);
  console.log('Next open:', marketStatus.market_status?.next_open);
  
  // Test trading calendar tool
  console.log('\n📅 Trading Calendar Tool:');
  const calendar = await tradingCalendarTool.function({ 
    symbol: TEST_SYMBOL, 
    days_ahead: 5 
  });
  console.log('Period:', calendar.period?.start, 'to', calendar.period?.end);
  console.log('Trading days:', calendar.trading_calendar?.trading_days?.length || 0);
  console.log('Holidays in period:', calendar.trading_calendar?.holidays?.length || 0);
  console.log('Total hours:', calendar.trading_calendar?.total_trading_hours);
  
  // Test execution timing tool
  console.log('\n⏰ Execution Timing Tool:');
  const executionTiming = await executionTimingTool.function({ 
    symbol: TEST_SYMBOL,
    strategy_type: 'momentum'
  });
  console.log('Current session:', executionTiming.execution_timing?.current_session);
  console.log('Suitability:', executionTiming.execution_timing?.session_suitability);
  console.log('Liquidity level:', executionTiming.execution_timing?.liquidity_level);
  console.log('Recommended action:', executionTiming.execution_timing?.recommended_action);
  
  // Test risk session tool
  console.log('\n⚠️  Risk Session Tool:');
  const riskAssessment = await riskSessionTool.function({ 
    symbol: TEST_SYMBOL,
    strategy: 'general'
  });
  console.log('Risk level:', riskAssessment.session_risk?.risk_level);
  console.log('Position multiplier:', riskAssessment.session_risk?.position_size_multiplier);
  console.log('Liquidity risk:', riskAssessment.session_risk?.session_factors?.liquidity_risk);
  console.log('Max position %:', riskAssessment.session_risk?.max_position_pct);
  
  return { marketStatus, calendar, executionTiming, riskAssessment };
}

async function testToolDefinitions() {
  console.log('\n📋 Testing Tool Definitions...\n');
  
  const tools = [
    { name: 'Base Session Tool', tool: apiTool },
    { name: 'Market Status', tool: marketStatusTool },
    { name: 'Trading Calendar', tool: tradingCalendarTool },
    { name: 'Execution Timing', tool: executionTimingTool },
    { name: 'Risk Session', tool: riskSessionTool }
  ];
  
  tools.forEach(({ name, tool }) => {
    const def = tool.definition.function;
    console.log(`✅ ${name}:`);
    console.log(`   Function: ${def.name}`);
    console.log(`   Description: ${def.description}`);
    console.log(`   Required params: ${def.parameters.required?.join(', ') || 'none'}`);
    console.log(`   Optional params: ${Object.keys(def.parameters.properties || {})
      .filter(p => !def.parameters.required?.includes(p))
      .join(', ') || 'none'}`);
    console.log('');
  });
}

async function runTests() {
  console.log('🚀 Session Tools Test Suite\n');
  console.log('=' .repeat(50));
  
  try {
    await testBaseSessionTool();
    await testDerivedSessionTools();
    await testToolDefinitions();
    
    console.log('✅ All tests completed successfully!');
    console.log('\n📈 Summary:');
    console.log('- Base session tool with optimization: ✓');
    console.log('- Market status real-time tool: ✓');
    console.log('- Trading calendar planning tool: ✓');
    console.log('- Execution timing optimization tool: ✓');
    console.log('- Risk session assessment tool: ✓');
    console.log('- Tool definitions validation: ✓');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
