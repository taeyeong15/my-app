import { pool } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'notices':
        return await getNotices();
      case 'best-practices':
        return await getBestPractices();
      case 'recommended-segments':
        return await getRecommendedSegments();
      case 'kpi-metrics':
        return await getKPIMetrics();
      case 'alerts':
        return await getAlerts();
      case 'pending-campaigns':
        return await getPendingCampaigns();
      case 'all':
      default:
        return await getAllDashboardData();
    }
  } catch (error) {
    console.error('대시보드 고급 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 공지사항 조회
async function getNotices() {
  try {
    const [notices] = await pool.execute(`
      SELECT 
        id, title, content, type, priority, status, 
        target_audience, start_date, end_date, 
        is_popup, is_important, read_count,
        created_by, created_at, updated_at
      FROM notices 
      WHERE status = 'published' 
        AND (start_date IS NULL OR start_date <= CURDATE())
        AND (end_date IS NULL OR end_date >= CURDATE())
      ORDER BY is_important DESC, priority DESC, created_at DESC 
      LIMIT 5
    `);

    return NextResponse.json({ notices });
  } catch (error) {
    console.error('공지사항 조회 실패:', error);
    return NextResponse.json({ notices: [] });
  }
}

// 캠페인 우수사례 조회
async function getBestPractices() {
  try {
    const [bestPractices] = await pool.execute(`
      SELECT 
        id, campaign_id, campaign_name, campaign_type, success_metric,
        metric_value, achievement_rate, target_audience, key_tactics,
        success_factors, lessons_learned, recommended_for, image_url,
        start_date, end_date, is_featured, view_count, like_count,
        created_by, created_at
      FROM campaign_best_practices 
      ORDER BY is_featured DESC, achievement_rate DESC, created_at DESC
      LIMIT 6
    `);

    return NextResponse.json({ bestPractices });
  } catch (error) {
    console.error('우수사례 조회 실패:', error);
    return NextResponse.json({ bestPractices: [] });
  }
}

// 추천 고객군 조회
async function getRecommendedSegments() {
  try {
    const [segments] = await pool.execute(`
      SELECT 
        id, segment_name, segment_description, segment_size, potential_value,
        conversion_probability, recommended_channels, recommended_offers,
        behavioral_patterns, engagement_score, churn_risk, lifetime_value,
        last_activity_date, priority_level, campaign_suggestions,
        created_by, created_at
      FROM recommended_customer_segments 
      WHERE is_active = TRUE
      ORDER BY priority_level DESC, conversion_probability DESC, engagement_score DESC
      LIMIT 4
    `);

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('추천 고객군 조회 실패:', error);
    return NextResponse.json({ segments: [] });
  }
}

// KPI 지표 조회
async function getKPIMetrics() {
  try {
    // 최근 2일간의 일일 지표
    const [dailyMetrics] = await pool.execute(`
      SELECT 
        metric_date,
        dau,
        total_conversions,
        total_revenue,
        overall_conversion_rate,
        active_campaigns
      FROM kpi_dashboard_metrics 
      WHERE metric_type = 'daily' 
        AND metric_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      ORDER BY metric_date DESC 
      LIMIT 2
    `) as any[];

    const today = dailyMetrics[0] || null;
    const yesterday = dailyMetrics[1] || null;

    // 전일 대비 증감률 계산
    const calculateGrowth = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    // 소수점 2자리까지 반올림
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;

    const metrics = {
      dau: {
        value: today?.dau || 0,
        growth: roundToTwo(calculateGrowth(today?.dau || 0, yesterday?.dau || 0))
      },
      conversionRate: {
        value: roundToTwo(today?.overall_conversion_rate || 0),
        growth: roundToTwo(calculateGrowth(today?.overall_conversion_rate || 0, yesterday?.overall_conversion_rate || 0))
      },
      revenue: {
        value: today?.total_revenue || 0,
        growth: roundToTwo(calculateGrowth(today?.total_revenue || 0, yesterday?.total_revenue || 0))
      },
      activeCampaigns: {
        value: today?.active_campaigns || 0,
        growth: roundToTwo(calculateGrowth(today?.active_campaigns || 0, yesterday?.active_campaigns || 0))
      }
    };

    // 최근 7일 트렌드
    const [weeklyTrend] = await pool.execute(`
      SELECT 
        metric_date, 
        dau, 
        total_conversions, 
        total_revenue, 
        overall_conversion_rate,
        active_campaigns
      FROM kpi_dashboard_metrics 
      WHERE metric_type = 'daily' 
        AND metric_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY metric_date ASC
    `) as any[];

    // 트렌드 데이터도 소수점 2자리까지 반올림
    const formattedTrend = weeklyTrend.map((day: any) => ({
      ...day,
      overall_conversion_rate: roundToTwo(day.overall_conversion_rate || 0)
    }));

    return NextResponse.json({ 
      metrics,
      weeklyTrend: formattedTrend
    });
  } catch (error) {
    console.error('KPI 지표 조회 실패:', error);
    return NextResponse.json({ 
      metrics: {
        dau: { value: 0, growth: 0 },
        conversionRate: { value: 0, growth: 0 },
        revenue: { value: 0, growth: 0 },
        activeCampaigns: { value: 0, growth: 0 }
      },
      weeklyTrend: []
    });
  }
}

// 알림 조회
async function getAlerts() {
  try {
    const [alerts] = await pool.execute(`
      SELECT 
        id, alert_type, title, message, severity, related_entity_type,
        related_entity_id, action_url, is_read, is_dismissed, created_at
      FROM dashboard_alerts 
      WHERE is_dismissed = FALSE 
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY 
        CASE severity 
          WHEN 'error' THEN 1 
          WHEN 'warning' THEN 2 
          WHEN 'info' THEN 3 
          WHEN 'success' THEN 4 
        END,
        created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('알림 조회 실패:', error);
    return NextResponse.json({ alerts: [] });
  }
}

// 승인 대기 조회 - campaign_approval_requests 테이블 사용
async function getPendingCampaigns() {
  try {
    const [pendingCampaigns] = await pool.execute(`
      SELECT 
        COUNT(*) as pending_count
      FROM campaign_approval_requests
      WHERE status = 'PENDING'
    `);

    return NextResponse.json({ 
      pendingCampaigns: (pendingCampaigns as any[])[0] || { pending_count: 0 }
    });
  } catch (error) {
    console.error('승인 대기 조회 실패:', error);
    return NextResponse.json({ 
      pendingCampaigns: { pending_count: 0 }
    });
  }
}

// 모든 대시보드 데이터 조회
async function getAllDashboardData() {
  try {
    // 병렬로 모든 데이터 조회
    const [
      noticesResult,
      bestPracticesResult,
      segmentsResult,
      kpiResult,
      alertsResult,
      pendingCampaignsResult
    ] = await Promise.all([
      getNotices(),
      getBestPractices(),
      getRecommendedSegments(),
      getKPIMetrics(),
      getAlerts(),
      getPendingCampaigns()
    ]);

    // 각 결과에서 JSON 데이터 추출
    const notices = await noticesResult.json();
    const bestPractices = await bestPracticesResult.json();
    const segments = await segmentsResult.json();
    const kpi = await kpiResult.json();
    const alerts = await alertsResult.json();
    const pendingCampaigns = await pendingCampaignsResult.json();

    return NextResponse.json({
      notices: notices.notices,
      bestPractices: bestPractices.bestPractices,
      recommendedSegments: segments.segments,
      kpiMetrics: kpi,
      alerts: alerts.alerts,
      lastUpdated: new Date().toISOString(),
      pendingCampaigns: pendingCampaigns.pendingCampaigns
    });
  } catch (error) {
    console.error('통합 데이터 조회 실패:', error);
    throw error;
  }
} 