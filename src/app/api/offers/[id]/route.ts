import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = parseInt(params.id);
    
    if (isNaN(offerId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 오퍼 ID입니다.'
      }, { status: 400 });
    }

    // 오퍼 기본 정보 조회
    const [offerRows] = await pool.execute(`
      SELECT
        id,
        name,
        type,
        description,
        value,
        value_type,
        start_date,
        end_date,
        max_usage,
        usage_count,
        status,
        terms_conditions,
        created_by,
        created_at,
        updated_by,
        updated_at
      FROM offers
      WHERE id = ?
    `, [offerId]);

    const offers = offerRows as any[];
    
    if (offers.length === 0) {
      return NextResponse.json({
        success: false,
        error: '오퍼를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const offer = offers[0];

    // 오퍼 조건 정보 조회
    const [conditionRows] = await pool.execute(`
      SELECT
        point_accumulation,
        duplicate_usage,
        multiple_discount,
        usage_start_time,
        usage_end_time,
        min_quantity,
        max_quantity,
        min_amount,
        max_amount,
        monday_available,
        tuesday_available,
        wednesday_available,
        thursday_available,
        friday_available,
        saturday_available,
        sunday_available
      FROM offer_conditions
      WHERE offer_id = ?
    `, [offerId]);

    const conditions = conditionRows as any[];
    
    // 오퍼 대상 상품 조회
    const [productRows] = await pool.execute(`
      SELECT target_code
      FROM offer_products
      WHERE offer_id = ?
    `, [offerId]);

    const products = productRows as any[];

    // 응답 데이터 구성
    const responseData = {
      basicInfo: {
        name: offer.name,
        type: offer.type,
        description: offer.description || '',
        value: offer.value.toString(),
        value_type: offer.value_type,
        start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : '',
        end_date: offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : '',
        max_usage: offer.max_usage ? offer.max_usage.toString() : '',
        status: offer.status,
        terms_conditions: offer.terms_conditions || ''
      },
      conditions: conditions.length > 0 ? {
        point_accumulation: Boolean(conditions[0].point_accumulation),
        duplicate_usage: Boolean(conditions[0].duplicate_usage),
        multiple_discount: Boolean(conditions[0].multiple_discount),
        usage_start_time: conditions[0].usage_start_time || '',
        usage_end_time: conditions[0].usage_end_time || '',
        min_quantity: conditions[0].min_quantity ? conditions[0].min_quantity.toString() : '',
        max_quantity: conditions[0].max_quantity ? conditions[0].max_quantity.toString() : '',
        min_amount: conditions[0].min_amount ? conditions[0].min_amount.toString() : '',
        max_amount: conditions[0].max_amount ? conditions[0].max_amount.toString() : '',
        monday_available: Boolean(conditions[0].monday_available),
        tuesday_available: Boolean(conditions[0].tuesday_available),
        wednesday_available: Boolean(conditions[0].wednesday_available),
        thursday_available: Boolean(conditions[0].thursday_available),
        friday_available: Boolean(conditions[0].friday_available),
        saturday_available: Boolean(conditions[0].saturday_available),
        sunday_available: Boolean(conditions[0].sunday_available)
      } : {
        point_accumulation: false,
        duplicate_usage: false,
        multiple_discount: false,
        usage_start_time: '',
        usage_end_time: '',
        min_quantity: '',
        max_quantity: '',
        min_amount: '',
        max_amount: '',
        monday_available: true,
        tuesday_available: true,
        wednesday_available: true,
        thursday_available: true,
        friday_available: true,
        saturday_available: true,
        sunday_available: true
      },
      products: {
        target_codes: products.map(p => p.target_code)
      }
    };

    return NextResponse.json({
      success: true,
      offer: responseData
    });

  } catch (error: any) {
    console.error('오퍼 상세 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '오퍼 조회 중 오류가 발생했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = parseInt(params.id);
    
    if (isNaN(offerId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 오퍼 ID입니다.'
      }, { status: 400 });
    }

    const body = await request.json();
    const { basicInfo, conditions, products } = body;

    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. 오퍼 기본 정보 업데이트
      await connection.execute(`
        UPDATE offers SET
          name = ?,
          type = ?,
          description = ?,
          value = ?,
          value_type = ?,
          start_date = ?,
          end_date = ?,
          max_usage = ?,
          status = ?,
          terms_conditions = ?,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        basicInfo.name,
        basicInfo.type,
        basicInfo.description,
        parseFloat(basicInfo.value),
        basicInfo.value_type,
        basicInfo.start_date,
        basicInfo.end_date,
        basicInfo.max_usage ? parseInt(basicInfo.max_usage) : null,
        basicInfo.status,
        basicInfo.terms_conditions,
        'system', // TODO: 실제 사용자 정보로 교체
        offerId
      ]);

      // 2. 오퍼 조건 업데이트 (있으면 업데이트, 없으면 삽입)
      await connection.execute(`
        INSERT INTO offer_conditions (
          offer_id, point_accumulation, duplicate_usage, multiple_discount,
          usage_start_time, usage_end_time, min_quantity, max_quantity,
          min_amount, max_amount, monday_available, tuesday_available,
          wednesday_available, thursday_available, friday_available,
          saturday_available, sunday_available, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          point_accumulation = VALUES(point_accumulation),
          duplicate_usage = VALUES(duplicate_usage),
          multiple_discount = VALUES(multiple_discount),
          usage_start_time = VALUES(usage_start_time),
          usage_end_time = VALUES(usage_end_time),
          min_quantity = VALUES(min_quantity),
          max_quantity = VALUES(max_quantity),
          min_amount = VALUES(min_amount),
          max_amount = VALUES(max_amount),
          monday_available = VALUES(monday_available),
          tuesday_available = VALUES(tuesday_available),
          wednesday_available = VALUES(wednesday_available),
          thursday_available = VALUES(thursday_available),
          friday_available = VALUES(friday_available),
          saturday_available = VALUES(saturday_available),
          sunday_available = VALUES(sunday_available),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
      `, [
        offerId,
        conditions.point_accumulation,
        conditions.duplicate_usage,
        conditions.multiple_discount,
        conditions.usage_start_time || null,
        conditions.usage_end_time || null,
        conditions.min_quantity ? parseInt(conditions.min_quantity) : null,
        conditions.max_quantity ? parseInt(conditions.max_quantity) : null,
        conditions.min_amount ? parseFloat(conditions.min_amount) : null,
        conditions.max_amount ? parseFloat(conditions.max_amount) : null,
        conditions.monday_available,
        conditions.tuesday_available,
        conditions.wednesday_available,
        conditions.thursday_available,
        conditions.friday_available,
        conditions.saturday_available,
        conditions.sunday_available,
        'system', // TODO: 실제 사용자 정보로 교체
        'system'  // TODO: 실제 사용자 정보로 교체
      ]);

      // 3. 기존 오퍼 상품 삭제
      await connection.execute('DELETE FROM offer_products WHERE offer_id = ?', [offerId]);

      // 4. 새로운 오퍼 상품 삽입
      if (products.target_codes && products.target_codes.length > 0) {
        const insertValues = products.target_codes.map((code: string) => [offerId, code, 'system']);
        const placeholders = products.target_codes.map(() => '(?, ?, ?)').join(', ');
        
        await connection.execute(
          `INSERT INTO offer_products (offer_id, target_code, created_by) VALUES ${placeholders}`,
          insertValues.flat()
        );
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: '오퍼가 성공적으로 수정되었습니다.'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error: any) {
    console.error('오퍼 수정 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '오퍼 수정 중 오류가 발생했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = parseInt(params.id);
    
    if (isNaN(offerId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 오퍼 ID입니다.'
      }, { status: 400 });
    }

    // 오퍼 존재 여부 확인
    const [offerRows] = await pool.execute(
      'SELECT name FROM offers WHERE id = ?',
      [offerId]
    );

    if ((offerRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 오퍼를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const offerName = (offerRows as any[])[0].name;

    // 캠페인 연관성 확인: 해당 오퍼가 사용되는 캠페인들의 상태 조회
    const [campaignRows] = await pool.execute(`
      SELECT DISTINCT c.id, c.name, c.status 
      FROM campaign_offers co
      JOIN campaigns c ON co.campaign_id = c.id
      WHERE co.offer_id = ?
    `, [offerId]);

    const relatedCampaigns = campaignRows as any[];

    // 관련 캠페인이 있는 경우 상태 검증
    if (relatedCampaigns.length > 0) {
      // 'completed'가 아닌 상태의 캠페인들 찾기
      const nonCompletedCampaigns = relatedCampaigns.filter(campaign => campaign.status !== 'completed');

      if (nonCompletedCampaigns.length > 0) {
        const campaignNames = nonCompletedCampaigns.map(c => `"${c.name}" (${c.status})`).join(', ');
        
        return NextResponse.json({
          success: false,
          error: `이 오퍼는 아직 완료되지 않은 캠페인에서 사용 중입니다.\n\n관련 캠페인:\n${campaignNames}\n\n오퍼를 삭제하려면 관련된 모든 캠페인이 완료(completed) 상태여야 합니다.`
        }, { status: 400 });
      }

      // 모든 관련 캠페인이 'completed' 상태인 경우
      console.log(`오퍼 "${offerName}" 삭제 진행: 관련 캠페인들이 모두 완료 상태임`);
    }

    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. 캠페인-오퍼 연결 삭제 (관련 캠페인이 있는 경우)
      if (relatedCampaigns.length > 0) {
        await connection.execute('DELETE FROM campaign_offers WHERE offer_id = ?', [offerId]);
      }

      // 2. 오퍼 상품 삭제
      await connection.execute('DELETE FROM offer_products WHERE offer_id = ?', [offerId]);

      // 3. 오퍼 조건 삭제
      await connection.execute('DELETE FROM offer_conditions WHERE offer_id = ?', [offerId]);

      // 4. 오퍼 기본 정보 삭제
      await connection.execute('DELETE FROM offers WHERE id = ?', [offerId]);

      await connection.commit();
      connection.release();

      // 삭제 성공 메시지
      const successMessage = relatedCampaigns.length > 0 
        ? `오퍼 "${offerName}"가 성공적으로 삭제되었습니다.\n(관련 완료된 캠페인: ${relatedCampaigns.length}개)`
        : `오퍼 "${offerName}"가 성공적으로 삭제되었습니다.`;

      return NextResponse.json({
        success: true,
        message: successMessage
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error: any) {
    console.error('오퍼 삭제 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '오퍼 삭제 중 오류가 발생했습니다: ' + error.message
    }, { status: 500 });
  }
} 