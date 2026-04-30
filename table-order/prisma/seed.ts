import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 1. 매장 생성
  const store = await prisma.store.upsert({
    where: { id: 'store-001' },
    update: {},
    create: {
      id: 'store-001',
      name: '테이블오더 매장',
    },
  });
  console.log(`✅ 매장 생성: ${store.name}`);

  // 2. 관리자 계정 생성 (기본 비밀번호: admin1234)
  const adminPasswordHash = await bcrypt.hash('admin1234', 12);
  const admin = await prisma.admin.upsert({
    where: { storeId_username: { storeId: store.id, username: 'admin' } },
    update: {},
    create: {
      storeId: store.id,
      username: 'admin',
      passwordHash: adminPasswordHash,
    },
  });
  console.log(`✅ 관리자 계정 생성: ${admin.username}`);

  // 3. 카테고리 생성
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 1 },
      update: {},
      create: { storeId: store.id, name: '메인 메뉴', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { id: 2 },
      update: {},
      create: { storeId: store.id, name: '사이드', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { id: 3 },
      update: {},
      create: { storeId: store.id, name: '음료', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { id: 4 },
      update: {},
      create: { storeId: store.id, name: '디저트', sortOrder: 4 },
    }),
  ]);
  console.log(`✅ 카테고리 생성: ${categories.length}개`);

  // 4. 샘플 메뉴 생성
  const menuItems = [
    // 메인 메뉴
    { storeId: store.id, categoryId: 1, name: '불고기 덮밥', price: 12000, description: '달콤한 불고기와 밥', sortOrder: 1 },
    { storeId: store.id, categoryId: 1, name: '제육볶음 정식', price: 13000, description: '매콤한 제육볶음', sortOrder: 2 },
    { storeId: store.id, categoryId: 1, name: '김치찌개', price: 10000, description: '얼큰한 김치찌개', sortOrder: 3 },
    // 사이드
    { storeId: store.id, categoryId: 2, name: '계란말이', price: 4000, description: '부드러운 계란말이', sortOrder: 1 },
    { storeId: store.id, categoryId: 2, name: '감자튀김', price: 3000, description: '바삭한 감자튀김', sortOrder: 2 },
    // 음료
    { storeId: store.id, categoryId: 3, name: '아메리카노', price: 3000, description: '진한 아메리카노', sortOrder: 1 },
    { storeId: store.id, categoryId: 3, name: '콜라', price: 2000, description: '시원한 콜라', sortOrder: 2 },
    { storeId: store.id, categoryId: 3, name: '오렌지 주스', price: 3500, description: '신선한 오렌지 주스', sortOrder: 3 },
    // 디저트
    { storeId: store.id, categoryId: 4, name: '아이스크림', price: 3000, description: '달콤한 아이스크림', sortOrder: 1 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log(`✅ 메뉴 생성: ${menuItems.length}개`);

  // 5. 샘플 테이블 생성 (1~5번)
  const tablePasswordHash = await bcrypt.hash('1234', 12);
  for (let i = 1; i <= 5; i++) {
    await prisma.table.upsert({
      where: { storeId_tableNumber: { storeId: store.id, tableNumber: i } },
      update: {},
      create: {
        storeId: store.id,
        tableNumber: i,
        passwordHash: tablePasswordHash,
      },
    });
  }
  console.log(`✅ 테이블 생성: 5개 (1~5번)`);

  console.log('\n🎉 시드 데이터 생성 완료!');
  console.log('📋 기본 계정 정보:');
  console.log('   관리자 - username: admin, password: admin1234');
  console.log('   테이블 - tableNumber: 1~5, password: 1234');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
