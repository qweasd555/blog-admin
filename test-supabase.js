import { createClient } from '@supabase/supabase-js';

// 您的配置
const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0.RK8pQz9Qv7wKZ1yC-Qx9G3bS5P--k3-5Y2jZ_4b1_AA';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTAzNzAzMCwiZXhwIjoyMDc2NjEzMDMwfQ.sPtCIEOcftn-B9Z_vbAHsZ5VfxhD2yXShZzf3uf7toM';

console.log('🔍 测试Supabase项目状态...\n');

// 创建两个客户端进行对比测试
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testConnection() {
  try {
    console.log('1. 测试项目基础连接...');
    
    // 直接测试API端点
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   HTTP状态码:', response.status);
    console.log('   HTTP状态:', response.statusText);
    
    if (!response.ok) {
      console.log('   ❌ 基础连接失败');
      const errorText = await response.text();
      console.log('   错误详情:', errorText.substring(0, 200));
      return false;
    }
    
    console.log('   ✅ 基础连接正常\n');
    return true;
    
  } catch (error) {
    console.log('   ❌ 连接异常:', error.message);
    return false;
  }
}

async function testAnonConnection() {
  console.log('2. 测试匿名客户端连接...');
  
  try {
    const { data, error } = await supabaseAnon.from('posts').select('*').limit(1);
    
    if (error) {
      console.log('   ❌ 匿名客户端错误:');
      console.log('     错误代码:', error.code);
      console.log('     错误消息:', error.message);
      console.log('     错误详情:', error.details);
      console.log('     错误提示:', error.hint);
    } else {
      console.log('   ✅ 匿名客户端连接成功');
      console.log('     数据:', data);
    }
    
    return { success: !error, data, error };
    
  } catch (error) {
    console.log('   ❌ 匿名客户端异常:', error.message);
    return { success: false, error };
  }
}

async function testAdminConnection() {
  console.log('\n3. 测试管理员客户端连接...');
  
  try {
    const { data, error } = await supabaseAdmin.from('posts').select('*').limit(1);
    
    if (error) {
      console.log('   ❌ 管理员客户端错误:');
      console.log('     错误代码:', error.code);
      console.log('     错误消息:', error.message);
      console.log('     错误详情:', error.details);
      console.log('     错误提示:', error.hint);
      
      // 检查是否是RLS策略问题
      if (error.message.includes('policy') || error.message.includes('RLS')) {
        console.log('   💡 可能是RLS策略问题，建议检查表权限设置');
      }
    } else {
      console.log('   ✅ 管理员客户端连接成功');
      console.log('     数据:', data);
    }
    
    return { success: !error, data, error };
    
  } catch (error) {
    console.log('   ❌ 管理员客户端异常:', error.message);
    return { success: false, error };
  }
}

async function testTables() {
  console.log('\n4. 测试可用表结构...');
  
  const tables = ['posts', 'post_comments', 'profiles', 'users', 'user_profiles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   📭 表 ${table}: 不存在`);
        } else {
          console.log(`   ❌ 表 ${table}: 访问错误 - ${error.message}`);
        }
      } else {
        console.log(`   ✅ 表 ${table}: 存在 ${data ? data.length : 0} 条记录`);
      }
      
    } catch (error) {
      console.log(`   ❌ 表 ${table}: 测试异常 - ${error.message}`);
    }
  }
}

async function main() {
  console.log('=== Supabase连接诊断 ===\n');
  
  // 测试基础连接
  const baseConnected = await testConnection();
  
  if (baseConnected) {
    // 测试客户端连接
    await testAnonConnection();
    await testAdminConnection();
    
    // 测试表结构
    await testTables();
  }
  
  console.log('\n=== 诊断完成 ===');
  console.log('\n💡 建议:');
  console.log('1. 检查Supabase项目是否被暂停或删除');
  console.log('2. 检查RLS策略设置');
  console.log('3. 检查表是否存在且可访问');
  console.log('4. 尝试在Supabase控制台重新生成API密钥');
}

main().catch(console.error);