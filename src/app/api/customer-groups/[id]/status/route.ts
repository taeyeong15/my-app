import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CampaignCheck extends RowDataPacket {
  campaign_id: number;
  campaign_name: string;
  status: string;
}

interface CustomerGroup extends RowDataPacket {
  id: number;
  group_name: string;
  status: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const customerGroupId = parseInt(params.id);

    // 입력값 검증
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'status는 ACTIVE 또는 INACTIVE 값이어야 합니다.'
      }, { status: 400 });
    }

    if (isNaN(customerGroupId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 고객군 ID입니다.'
      }, { status: 400 });
    }

    // 1. 고객군 존재 여부 확인
    const [customerGroups] = await pool.execute<CustomerGroup[]>(
      'SELECT id, group_name, status FROM customer_groups WHERE id = ? AND use_yn = "Y"',
      [customerGroupId]
    );

    if (customerGroups.length === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const customerGroup = customerGroups[0];
    
    // 현재 상태와 동일한 경우
    if (customerGroup.status === status) {
      return NextResponse.json({
        success: true,
        message: `고객군이 이미 ${status === 'ACTIVE' ? '활성' : '비활성'} 상태입니다.`,
        data: customerGroup
      });
    }

    // 2. 비활성화 시 진행 중인 캠페인 확인
    if (status === 'INACTIVE') {
      console.log(`고객군 ${customerGroupId} 비활성화 검증 시작...`);
      
      // 캠페인에 매핑된 고객군이 존재하는지 확인
      try {
        const [campaignChecks] = await pool.execute<CampaignCheck[]>(`
          SELECT DISTINCT a.id as campaign_id, a.name as campaign_name, a.status
          FROM campaigns a
          INNER JOIN campaign_customer_groups b ON a.id = b.campaign_id
          INNER JOIN customer_groups c ON c.id = b.customer_group_id
          WHERE 1=1
          AND a.status != 'COMPLETED'
          AND b.customer_group_id = ?
        `, [customerGroupId]);

        console.log(`진행 중인 캠페인 확인 결과: ${campaignChecks.length}개`);

        if (campaignChecks.length > 0) {
          const activeCampaigns = campaignChecks.map(campaign => 
            `${campaign.campaign_name} (${campaign.status})`
          ).join(', ');

          return NextResponse.json({
            success: false,
            error: '이 고객군을 사용하는 진행 중인 캠페인이 있어 비활성화할 수 없습니다.',
            details: {
              message: '다음 캠페인들이 완료된 후 비활성화할 수 있습니다.',
              activeCampaigns: campaignChecks.map(campaign => ({
                id: campaign.campaign_id,
                name: campaign.campaign_name,
                status: campaign.status
              }))
            }
          }, { status: 409 });
        }
      } catch (error) {
        console.log('캠페인 확인 중 오류:', error);
      }
    }

    // 3. 상태 업데이트
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE customer_groups SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, customerGroupId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '고객군 상태 업데이트에 실패했습니다.'
      }, { status: 500 });
    }

    // 4. 업데이트된 고객군 정보 조회
    const [updatedGroups] = await pool.execute<CustomerGroup[]>(
      'SELECT id, group_name, status FROM customer_groups WHERE id = ?',
      [customerGroupId]
    );

    return NextResponse.json({
      success: true,
      message: `고객군이 성공적으로 ${status === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`,
      data: updatedGroups[0]
    });

  } catch (error) {
    console.error('고객군 상태 변경 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 상태 변경 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerGroupId = parseInt(params.id);

    if (isNaN(customerGroupId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 고객군 ID입니다.'
      }, { status: 400 });
    }

    // 고객군 상태 조회
    const [customerGroups] = await pool.execute<CustomerGroup[]>(
      'SELECT id, group_name, status FROM customer_groups WHERE id = ? AND use_yn = "Y"',
      [customerGroupId]
    );

    if (customerGroups.length === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: customerGroups[0]
    });

  } catch (error) {
    console.error('고객군 상태 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 상태 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 