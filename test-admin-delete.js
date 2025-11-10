// 测试高级权限删除功能
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 读取.env文件中的配置
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env文件不存在');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少必要的环境变量');
  console.log('当前环境变量:', { 
    url: SUPABASE_URL ? '已设置' : '未设置',
    serviceKey: SUPABASE_SERVICE_KEY ? '已设置' : '未设置'
  });
  process.exit(1);
}

console.log('🔧 初始化Supabase客户端...');
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAdminDelete() {
  console.log('\n🔍 开始测试高级权限删除功能...\n');

  try {
    // 1. 首先获取几条评论用于测试
    console.log('📥 获取评论数据...');
    const { data: comments, error: fetchError } = await supabaseAdmin
      .from('post_comments')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 获取评论数据失败:', fetchError);
      return;
    }

    console.log(`✅ 成功获取 ${comments.length} 条评论`);

    if (comments.length === 0) {
      console.log('ℹ️ 没有评论数据，跳过删除测试');
      return;
    }

    // 2. 测试第一条评论的删除权限
    const testComment = comments[0];
    console.log(`\n🗑️ 测试删除评论 ID: ${testComment.id}`);
    console.log('内容:', testComment.content?.substring(0, 50) + '...');

    // 3. 执行删除操作
    console.log('🔑 使用高级权限执行删除...');
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('id', testComment.id)
      .select();

    if (deleteError) {
      console.error('❌ 删除失败:', deleteError);
      
      // 检查错误详情
      if (deleteError.code === '42501') {
        console.error('💡 错误分析: 权限不足 (RLS策略限制)');
      } else if (deleteError.code === '42P01') {
        console.error('💡 错误分析: 表不存在');
      } else {
        console.error('💡 错误分析:', deleteError.message);
      }
      
      return;
    }

    console.log('✅ 删除成功!');
    console.log('📊 删除结果:', deleteResult);

    // 4. 验证删除结果
    console.log('\n🔍 验证删除结果...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('post_comments')
      .select('*')
      .eq('id', testComment.id);

    if (verifyError) {
      console.error('❌ 验证查询失败:', verifyError);
      return;
    }

    if (verifyData.length === 0) {
      console.log('✅ 验证成功: 评论已被正确删除');
    } else {
      console.log('❌ 验证失败: 评论仍然存在');
      console.log('剩余数据:', verifyData);
    }

    // 5. 测试其他可能的表名
    console.log('\n🔍 测试其他可能的表名...');
    const tableNames = ['comments', 'article_comments', 'user_comments'];
    
    for (const tableName of tableNames) {
      try {
        console.log(`🔄 测试表名: ${tableName}`);
        const { error: tableError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);

        if (tableError) {
          console.log(`❌ 表 ${tableName} 不存在: ${tableError.message}`);
        } else {
          console.log(`✅ 表 ${tableName} 存在`);
        }
      } catch (err) {
        console.log(`❌ 表 ${tableName} 测试失败:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error);
  }
}

// 运行测试
testAdminDelete().then(() => {
  console.log('\n🎉 测试完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});