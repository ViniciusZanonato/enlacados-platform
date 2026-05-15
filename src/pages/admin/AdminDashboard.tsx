import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';

/* =============================================================
   Admin Dashboard — editorial dark, mock-port (AdminScreen.jsx)
   Self-contained: inline tokens, inline fonts, no shared atoms.
   All metrics, queues and logs come from real Supabase tables.
   ============================================================= */

type Tone = 'violet' | 'ok' | 'warn' | 'neutral' | 'danger';

const TONE_COLORS: Record<Tone, { bg: string; fg: string; bd: string; rail: string }> = {
    violet: {
        bg: 'oklch(0.55 0.22 295 / 0.14)',
        fg: 'oklch(0.85 0.12 295)',
        bd: 'oklch(0.55 0.22 295 / 0.3)',
        rail: 'oklch(0.55 0.22 295)',
    },
    ok: {
        bg: 'oklch(0.70 0.14 155 / 0.15)',
        fg: 'oklch(0.85 0.12 155)',
        bd: 'oklch(0.70 0.14 155 / 0.3)',
        rail: 'oklch(0.70 0.14 155)',
    },
    warn: {
        bg: 'oklch(0.75 0.15 65 / 0.15)',
        fg: 'oklch(0.88 0.10 75)',
        bd: 'oklch(0.75 0.15 65 / 0.3)',
        rail: 'oklch(0.75 0.15 65)',
    },
    danger: {
        bg: 'oklch(0.62 0.20 25 / 0.18)',
        fg: 'oklch(0.85 0.18 25)',
        bd: 'oklch(0.62 0.20 25 / 0.35)',
        rail: 'oklch(0.62 0.20 25)',
    },
    neutral: {
        bg: 'oklch(1 0 0 / 0.04)',
        fg: 'oklch(0.85 0.005 300)',
        bd: 'oklch(1 0 0 / 0.12)',
        rail: 'oklch(1 0 0 / 0.35)',
    },
};

const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const MONO = "'Geist Mono', 'Menlo', 'Monaco', 'Consolas', monospace";
const SANS = "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const SURFACE_INK = 'oklch(0.11 0.015 295)';
const VIOLET_500 = 'oklch(0.55 0.22 295)';
const ORCHID = 'oklch(0.75 0.18 315)';

interface AuditLogRow {
    id: string;
    operation: string;
    table_name: string;
    record_id: string | null;
    changed_by: string | null;
    created_at: string | null;
    new_data: unknown;
}

interface CommunicationLogRow {
    id: string;
    message: string;
    moderation_reason: string | null;
    moderation_status: string | null;
    type: string | null;
    sender_id: string;
    created_at: string | null;
    institution_profile_id: string | null;
}

interface CommentFlagRow {
    id: string;
    reason: string;
    description: string;
    is_resolved: boolean;
    created_at: string;
    comment_id: string;
}

interface IncidentRow {
    id: string;
    title: string;
    description: string | null;
    impact_level: string | null;
    status: string;
    reported_at: string;
    resolved_at: string | null;
}

export default function AdminDashboard() {
    // Inject Instrument Serif (used in the editorial display headline)
    useEffect(() => {
        const id = 'admin-instrument-serif';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
        document.head.appendChild(link);
    }, []);

    const queries = useQueries({
        queries: [
            {
                queryKey: ['admin-totalUsers'],
                queryFn: async () => {
                    const { count, error } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true });
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-newUsersToday'],
                queryFn: async () => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const { count, error } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', today.toISOString());
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-institutions'],
                queryFn: async () => {
                    const { count, error } = await supabase
                        .from('institutional_profiles')
                        .select('id', { count: 'exact', head: true });
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-newInstitutionsWeek'],
                queryFn: async () => {
                    const ago = new Date(Date.now() - 7 * 86400_000);
                    const { count, error } = await supabase
                        .from('institutional_profiles')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', ago.toISOString());
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-activeSubs'],
                queryFn: async () => {
                    const { count, error } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .eq('subscription_status', 'active');
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-openIncidentsCount'],
                queryFn: async () => {
                    // Match the predicate used by ['admin-openIncidents'] below so
                    // the KPI / SystemStatus banner stay consistent with the list.
                    const { count, error } = await supabase
                        .from('incident_logs')
                        .select('id', { count: 'exact', head: true })
                        .neq('status', 'resolvido');
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-auditToday'],
                queryFn: async () => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const { count, error } = await supabase
                        .from('audit_logs')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', today.toISOString());
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-flaggedCount'],
                queryFn: async () => {
                    const { count, error } = await supabase
                        .from('communication_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('moderation_status', 'flagged');
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-pendingFlags'],
                queryFn: async () => {
                    const { count, error } = await supabase
                        .from('comment_flags')
                        .select('id', { count: 'exact', head: true })
                        .eq('is_resolved', false);
                    if (error) throw error;
                    return count ?? 0;
                },
            },
            {
                queryKey: ['admin-flaggedMessages'],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('communication_logs')
                        .select(
                            'id, message, moderation_reason, moderation_status, type, sender_id, created_at, institution_profile_id'
                        )
                        .eq('moderation_status', 'flagged')
                        .order('created_at', { ascending: false })
                        .limit(3);
                    if (error) throw error;
                    return (data ?? []) as CommunicationLogRow[];
                },
            },
            {
                queryKey: ['admin-pendingFlagsList'],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('comment_flags')
                        .select('id, reason, description, is_resolved, created_at, comment_id')
                        .eq('is_resolved', false)
                        .order('created_at', { ascending: false })
                        .limit(3);
                    if (error) throw error;
                    return (data ?? []) as CommentFlagRow[];
                },
            },
            {
                queryKey: ['admin-openIncidents'],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('incident_logs')
                        .select('id, title, description, impact_level, status, reported_at, resolved_at')
                        .neq('status', 'resolvido')
                        .order('reported_at', { ascending: false })
                        .limit(3);
                    if (error) throw error;
                    return (data ?? []) as IncidentRow[];
                },
            },
            {
                queryKey: ['admin-recentAuditLogs'],
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('audit_logs')
                        .select('id, operation, table_name, record_id, changed_by, created_at, new_data')
                        .order('created_at', { ascending: false })
                        .limit(8);
                    if (error) throw error;
                    return (data ?? []) as AuditLogRow[];
                },
            },
        ],
    });

    const [
        totalUsersQ,
        newUsersTodayQ,
        institutionsQ,
        newInstitutionsWeekQ,
        activeSubsQ,
        openIncidentsCountQ,
        auditTodayQ,
        flaggedCountQ,
        pendingFlagsCountQ,
        flaggedMsgsQ,
        pendingFlagsListQ,
        openIncidentsQ,
        auditLogsQ,
    ] = queries;

    const moderationItems = useMemo(() => {
        const items: Array<{
            id: string;
            type: string;
            description: string;
            tone: Tone;
            time: string | null;
            href: string;
        }> = [];
        for (const m of flaggedMsgsQ.data ?? []) {
            items.push({
                id: `msg-${m.id}`,
                type: 'Comunicação sinalizada',
                description: `${truncate(m.message, 60)} · ${m.moderation_reason ?? 'Sem motivo'}`,
                tone: 'warn',
                time: m.created_at,
                href: '/admin/moderation',
            });
        }
        for (const f of pendingFlagsListQ.data ?? []) {
            items.push({
                id: `flag-${f.id}`,
                type: 'Denúncia de comentário',
                description: `${f.reason} · ${truncate(f.description, 60)}`,
                tone: 'danger',
                time: f.created_at,
                href: '/admin/moderation',
            });
        }
        return items
            .sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''))
            .slice(0, 4);
    }, [flaggedMsgsQ.data, pendingFlagsListQ.data]);

    const moderationCountsLoading = flaggedCountQ.isLoading || pendingFlagsCountQ.isLoading;
    const moderationOpenCount =
        (flaggedCountQ.data ?? 0) + (pendingFlagsCountQ.data ?? 0);

    const incidents = openIncidentsQ.data ?? [];

    const failedQueries = queries.filter((q) => q.isError);
    const hasErrors = failedQueries.length > 0;

    return (
        <div
            style={{
                minHeight: '100%',
                background: SURFACE_INK,
                color: 'oklch(0.97 0.005 300)',
                fontFamily: SANS,
                margin: '-2rem',
                padding: '28px 36px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle grain overlay */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                        'radial-gradient(ellipse at top left, oklch(0.55 0.22 295 / 0.08), transparent 60%), radial-gradient(ellipse at bottom right, oklch(0.62 0.20 25 / 0.06), transparent 60%)',
                }}
            />

            <div style={{ position: 'relative' }}>
                {/* Page-wide shimmer keyframes — hoisted so any Skeleton variant
                    keeps animating regardless of which lists are mounted. */}
                <style>{`@keyframes admin-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

                {/* Admin warning banner */}
                <div
                    style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        background: 'oklch(0.62 0.20 25 / 0.12)',
                        border: '1px solid oklch(0.62 0.20 25 / 0.3)',
                        fontSize: 11,
                        fontFamily: MONO,
                        letterSpacing: '0.1em',
                        color: 'oklch(0.82 0.18 25)',
                        textTransform: 'uppercase',
                        marginBottom: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <Dot color="oklch(0.72 0.20 25)" />
                    MODO ADMIN · CUIDADO
                </div>

                {hasErrors && (
                    <div
                        role="alert"
                        style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'oklch(0.62 0.20 25 / 0.12)',
                            border: '1px solid oklch(0.62 0.20 25 / 0.35)',
                            color: 'oklch(0.85 0.18 25)',
                            fontSize: 12,
                            fontFamily: MONO,
                            letterSpacing: '0.06em',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>
                            <Dot color="oklch(0.72 0.20 25)" />{' '}
                            {failedQueries.length} CONSULTA(S) FALHARAM · DASHBOARD PARCIAL
                        </span>
                        <button
                            onClick={() => failedQueries.forEach((q) => q.refetch())}
                            style={{
                                padding: '5px 12px',
                                borderRadius: 999,
                                background: 'oklch(0.62 0.20 25 / 0.2)',
                                border: '1px solid oklch(0.62 0.20 25 / 0.4)',
                                color: 'oklch(0.95 0.10 25)',
                                fontSize: 11,
                                fontFamily: MONO,
                                cursor: 'pointer',
                                letterSpacing: '0.06em',
                            }}
                        >
                            TENTAR NOVAMENTE
                        </button>
                    </div>
                )}

                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: 24,
                        gap: 24,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div style={microLabel('oklch(1 0 0 / 0.5)')}>
                            Super-admin · Controle de plataforma
                        </div>
                        <div
                            style={{
                                fontFamily: SERIF,
                                fontSize: 44,
                                lineHeight: 1,
                                letterSpacing: '-0.03em',
                                marginTop: 8,
                            }}
                        >
                            Centro de{' '}
                            <span style={{ fontStyle: 'italic', color: ORCHID }}>operações</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SystemStatus
                            tone={
                                openIncidentsCountQ.isLoading
                                    ? 'neutral'
                                    : openIncidentsCountQ.isError
                                    ? 'danger'
                                    : (openIncidentsCountQ.data ?? 0) === 0
                                    ? 'ok'
                                    : 'warn'
                            }
                            label={
                                openIncidentsCountQ.isLoading
                                    ? 'VERIFICANDO STATUS…'
                                    : openIncidentsCountQ.isError
                                    ? 'STATUS INDISPONÍVEL'
                                    : (openIncidentsCountQ.data ?? 0) === 0
                                    ? 'TODOS SISTEMAS OK'
                                    : `${openIncidentsCountQ.data} INCIDENTE(S) ATIVO(S)`
                            }
                        />
                        <Link
                            to="/admin/audit-logs"
                            style={{
                                padding: '8px 14px',
                                fontSize: 12.5,
                                color: 'oklch(1 0 0 / 0.85)',
                                background: 'oklch(1 0 0 / 0.04)',
                                border: '1px solid oklch(1 0 0 / 0.1)',
                                borderRadius: 999,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                fontFamily: SANS,
                            }}
                        >
                            Logs brutos
                        </Link>
                        <Link
                            to="/admin/moderation"
                            style={{
                                padding: '8px 14px',
                                fontSize: 12.5,
                                color: 'white',
                                background: VIOLET_500,
                                border: '1px solid oklch(0.55 0.22 295 / 0.6)',
                                borderRadius: 999,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                fontFamily: SANS,
                            }}
                        >
                            Nova ação <ArrowSm />
                        </Link>
                    </div>
                </div>

                {/* KPI row */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: 10,
                        marginBottom: 14,
                    }}
                >
                    <KpiCard
                        label="Usuários totais"
                        value={fmt(totalUsersQ.data ?? null)}
                        delta={
                            newUsersTodayQ.isLoading
                                ? '—'
                                : (newUsersTodayQ.data ?? 0) > 0
                                ? `+${newUsersTodayQ.data} hoje`
                                : 'Sem novos hoje'
                        }
                        loading={totalUsersQ.isLoading}
                    />
                    <KpiCard
                        label="Instituições"
                        value={fmt(institutionsQ.data ?? null)}
                        delta={
                            newInstitutionsWeekQ.isLoading
                                ? '—'
                                : (newInstitutionsWeekQ.data ?? 0) > 0
                                ? `+${newInstitutionsWeekQ.data} esta semana`
                                : 'Sem novas esta semana'
                        }
                        loading={institutionsQ.isLoading}
                    />
                    <KpiCard
                        label="Assinaturas ativas"
                        value={fmt(activeSubsQ.data ?? null)}
                        delta="Plano pago vigente"
                        loading={activeSubsQ.isLoading}
                    />
                    <KpiCard
                        label="Incidentes abertos"
                        value={fmt(openIncidentsCountQ.data ?? null)}
                        delta={
                            openIncidentsCountQ.isLoading
                                ? '—'
                                : openIncidentsCountQ.isError
                                ? 'Falha ao consultar'
                                : (openIncidentsCountQ.data ?? 0) === 0
                                ? 'Operação saudável'
                                : 'Verificar fila'
                        }
                        loading={openIncidentsCountQ.isLoading}
                        tone={
                            openIncidentsCountQ.isLoading
                                ? 'neutral'
                                : openIncidentsCountQ.isError
                                ? 'danger'
                                : (openIncidentsCountQ.data ?? 0) > 0
                                ? 'warn'
                                : 'ok'
                        }
                    />
                    <KpiCard
                        label="Logs hoje"
                        value={fmt(auditTodayQ.data ?? null)}
                        delta="Eventos registrados"
                        loading={auditTodayQ.isLoading}
                    />
                </div>

                {/* Moderation + Incidents */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
                        gap: 14,
                        marginBottom: 14,
                    }}
                >
                    {/* Moderation queue */}
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <div style={microLabel('oklch(1 0 0 / 0.5)')}>FILA DE MODERAÇÃO</div>
                                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                                    Itens aguardando decisão
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontFamily: MONO,
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    background: moderationCountsLoading
                                        ? 'oklch(1 0 0 / 0.05)'
                                        : moderationOpenCount > 0
                                        ? 'oklch(0.62 0.20 25 / 0.18)'
                                        : 'oklch(0.70 0.14 155 / 0.18)',
                                    color: moderationCountsLoading
                                        ? 'oklch(1 0 0 / 0.55)'
                                        : moderationOpenCount > 0
                                        ? 'oklch(0.88 0.18 25)'
                                        : 'oklch(0.85 0.14 155)',
                                    letterSpacing: '0.08em',
                                    border: moderationCountsLoading
                                        ? '1px solid oklch(1 0 0 / 0.12)'
                                        : 'none',
                                }}
                            >
                                {moderationCountsLoading
                                    ? '—'
                                    : moderationOpenCount > 0
                                    ? `${moderationOpenCount} ABERTO(S)`
                                    : '0 ABERTOS'}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {flaggedMsgsQ.isLoading || pendingFlagsListQ.isLoading ? (
                                <ListSkeleton rows={3} />
                            ) : moderationItems.length === 0 ? (
                                <Empty
                                    title="Fila vazia"
                                    hint="Nada aguardando moderação no momento."
                                />
                            ) : (
                                moderationItems.map((item) => (
                                    <ModerationRow key={item.id} {...item} />
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Incidents + deploys */}
                    <Card>
                        <div style={microLabel('oklch(1 0 0 / 0.5)')}>INCIDENTES EM CURSO</div>
                        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4, marginBottom: 14 }}>
                            Status operacional
                        </div>
                        {openIncidentsQ.isLoading ? (
                            <ListSkeleton rows={2} />
                        ) : incidents.length === 0 ? (
                            <Empty title="Sem incidentes abertos" hint="Nada para investigar agora." />
                        ) : (
                            incidents.map((i) => <IncidentRow key={i.id} incident={i} />)
                        )}

                        <div style={{ ...microLabel('oklch(1 0 0 / 0.5)'), marginTop: 14 }}>
                            ÚLTIMAS ATUALIZAÇÕES NO BANCO
                        </div>
                        <RecentAuditDeployList
                            logs={auditLogsQ.data ?? []}
                            loading={auditLogsQ.isLoading}
                        />
                    </Card>
                </div>

                {/* Audit log streaming */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={microLabel('oklch(1 0 0 / 0.5)')}>AUDIT LOG · STREAMING</div>
                            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                                Eventos recentes
                            </div>
                        </div>
                        <Link
                            to="/admin/audit-logs"
                            style={{
                                fontSize: 12,
                                fontFamily: MONO,
                                color: ORCHID,
                                textDecoration: 'none',
                                alignSelf: 'center',
                                display: 'inline-flex',
                                gap: 6,
                                alignItems: 'center',
                            }}
                        >
                            VER COMPLETO <ArrowSm />
                        </Link>
                    </div>
                    <AuditLogTable
                        logs={auditLogsQ.data ?? []}
                        loading={auditLogsQ.isLoading}
                    />
                </Card>
            </div>
        </div>
    );
}

/* =============================================================
   Components
   ============================================================= */

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: 20,
                borderRadius: 14,
                background: 'oklch(0.13 0.018 295)',
                border: '1px solid oklch(1 0 0 / 0.06)',
            }}
        >
            {children}
        </div>
    );
}

function KpiCard({
    label,
    value,
    delta,
    loading,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    delta: string;
    loading: boolean;
    tone?: Tone;
}) {
    const c = TONE_COLORS[tone];
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 14,
                background: 'oklch(0.13 0.018 295)',
                border: '1px solid oklch(1 0 0 / 0.06)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {tone !== 'neutral' && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 12,
                        bottom: 12,
                        width: 2,
                        background: c.rail,
                        borderRadius: 999,
                    }}
                />
            )}
            <div style={microLabel('oklch(1 0 0 / 0.5)', 9.5)}>{label}</div>
            <div
                style={{
                    fontFamily: SERIF,
                    fontSize: 30,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    marginTop: 6,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {loading ? <Skeleton width={64} height={28} /> : value}
            </div>
            <div
                style={{
                    fontSize: 10.5,
                    color: 'oklch(1 0 0 / 0.55)',
                    fontFamily: MONO,
                    marginTop: 8,
                }}
            >
                {delta}
            </div>
        </div>
    );
}

function ModerationRow({
    type,
    description,
    tone,
    time,
    href,
}: {
    type: string;
    description: string;
    tone: Tone;
    time: string | null;
    href: string;
}) {
    const c = TONE_COLORS[tone];
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                background: 'oklch(1 0 0 / 0.025)',
                border: '1px solid oklch(1 0 0 / 0.06)',
            }}
        >
            <div style={{ width: 6, height: 32, borderRadius: 999, background: c.rail }} />
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{type}</div>
                <div
                    style={{
                        fontSize: 11,
                        color: 'oklch(1 0 0 / 0.55)',
                        marginTop: 2,
                        fontFamily: MONO,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {description}
                </div>
            </div>
            <span style={{ ...microLabel('oklch(1 0 0 / 0.45)') }}>
                {relative(time)}
            </span>
            <Link
                to={href}
                style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: 'oklch(0.55 0.22 295 / 0.18)',
                    border: '1px solid oklch(0.55 0.22 295 / 0.3)',
                    color: 'white',
                    fontSize: 11,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontFamily: SANS,
                }}
            >
                Revisar →
            </Link>
        </div>
    );
}

function IncidentRow({ incident }: { incident: IncidentRow }) {
    const sev = (incident.impact_level ?? 'medio').toLowerCase();
    const sevColor =
        sev === 'critico' || sev === 'alto'
            ? 'oklch(0.62 0.20 25)'
            : sev === 'medio'
            ? 'oklch(0.75 0.15 65)'
            : VIOLET_500;
    const code =
        sev === 'critico' ? 'P0' : sev === 'alto' ? 'P1' : sev === 'medio' ? 'P2' : 'P3';
    return (
        <div
            style={{
                padding: 14,
                borderRadius: 12,
                marginBottom: 10,
                background: 'oklch(1 0 0 / 0.025)',
                border: '1px solid oklch(1 0 0 / 0.07)',
            }}
        >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span
                    style={{
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: sevColor,
                        color: 'oklch(0.11 0.015 295)',
                        fontSize: 10.5,
                        fontFamily: MONO,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                    }}
                >
                    {code}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{incident.title}</span>
            </div>
            <div style={{ fontSize: 12, color: 'oklch(1 0 0 / 0.6)' }}>
                {incident.description ?? `Status: ${incident.status}`}
            </div>
            <div
                style={{
                    fontSize: 10.5,
                    color: 'oklch(1 0 0 / 0.45)',
                    fontFamily: MONO,
                    marginTop: 6,
                    letterSpacing: '0.06em',
                }}
            >
                Reportado {relative(incident.reported_at)}
            </div>
        </div>
    );
}

function RecentAuditDeployList({
    logs,
    loading,
}: {
    logs: AuditLogRow[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div style={{ marginTop: 8 }}>
                <ListSkeleton rows={2} />
            </div>
        );
    }
    if (logs.length === 0) {
        return (
            <div style={{ ...microLabel('oklch(1 0 0 / 0.4)'), marginTop: 8 }}>
                NENHUM EVENTO RECENTE
            </div>
        );
    }
    // Mark a row as live only if it actually happened in the last 5 minutes,
    // not just because it's the most recent of an arbitrary recency window.
    const LIVE_WINDOW_MS = 5 * 60_000;
    return (
        <div>
            {logs.slice(0, 3).map((d) => {
                const t = d.created_at ? new Date(d.created_at).getTime() : 0;
                const isLive = t > 0 && Date.now() - t < LIVE_WINDOW_MS;
                return (
                    <div
                        key={d.id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '9px 0',
                            borderBottom: '1px solid oklch(1 0 0 / 0.05)',
                            fontSize: 12,
                            fontFamily: MONO,
                            color: 'oklch(1 0 0 / 0.65)',
                            gap: 8,
                        }}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            #{d.id.slice(0, 6)} · {d.operation} {d.table_name}
                        </span>
                        <span
                            style={{
                                color: isLive ? 'oklch(0.85 0.14 155)' : 'oklch(1 0 0 / 0.45)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {isLive ? '● AGORA' : `○ ${relative(d.created_at)}`}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function AuditLogTable({
    logs,
    loading,
}: {
    logs: AuditLogRow[];
    loading: boolean;
}) {
    const cols = '90px 80px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.8fr)';
    return (
        <div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: cols,
                    gap: 16,
                    padding: '8px 0',
                    borderBottom: '1px solid oklch(1 0 0 / 0.06)',
                    fontSize: 10,
                    fontFamily: MONO,
                    letterSpacing: '0.1em',
                    color: 'oklch(1 0 0 / 0.45)',
                    textTransform: 'uppercase',
                }}
            >
                <span>HORA</span>
                <span>OPERAÇÃO</span>
                <span>ATOR</span>
                <span>TABELA</span>
                <span>RECURSO</span>
                <span>QUANDO</span>
            </div>
            {loading ? (
                <ListSkeleton rows={4} />
            ) : logs.length === 0 ? (
                <Empty title="Sem eventos recentes" hint="Nenhum log de auditoria registrado nas últimas horas." />
            ) : (
                logs.map((row) => {
                    const op = (row.operation ?? '').toUpperCase();
                    const opColor =
                        op === 'DELETE'
                            ? 'oklch(0.82 0.18 25)'
                            : op === 'UPDATE'
                            ? 'oklch(0.88 0.12 75)'
                            : op === 'INSERT'
                            ? 'oklch(0.78 0.12 155)'
                            : 'oklch(1 0 0 / 0.7)';
                    const time = row.created_at ? new Date(row.created_at) : null;
                    return (
                        <div
                            key={row.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: cols,
                                gap: 16,
                                padding: '9px 0',
                                borderBottom: '1px solid oklch(1 0 0 / 0.04)',
                                fontSize: 11.5,
                                fontFamily: MONO,
                                color: 'oklch(1 0 0 / 0.72)',
                                alignItems: 'center',
                            }}
                        >
                            <span>
                                {time
                                    ? time.toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit',
                                      })
                                    : '—'}
                            </span>
                            <span style={{ color: opColor }}>{op || '—'}</span>
                            <span
                                style={{
                                    color: ORCHID,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={row.changed_by ?? ''}
                            >
                                {row.changed_by ? truncateId(row.changed_by) : 'system'}
                            </span>
                            <span style={{ color: 'white' }}>{row.table_name}</span>
                            <span
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={row.record_id ?? ''}
                            >
                                {row.record_id ? truncateId(row.record_id) : '—'}
                            </span>
                            <span style={{ color: 'oklch(1 0 0 / 0.45)' }}>
                                {relative(row.created_at)}
                            </span>
                        </div>
                    );
                })
            )}
        </div>
    );
}

function SystemStatus({ tone, label }: { tone: Tone; label: string }) {
    const c = TONE_COLORS[tone];
    return (
        <div
            style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: c.bg,
                border: `1px solid ${c.bd}`,
                fontSize: 11.5,
                fontFamily: MONO,
                color: c.fg,
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: c.rail,
                    display: 'inline-block',
                }}
            />
            {label}
        </div>
    );
}

function Empty({ title, hint }: { title: string; hint: string }) {
    return (
        <div
            style={{
                padding: '28px 12px',
                borderRadius: 12,
                background: 'oklch(1 0 0 / 0.02)',
                border: '1px dashed oklch(1 0 0 / 0.12)',
                textAlign: 'center',
            }}
        >
            <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
            <div
                style={{
                    fontSize: 11.5,
                    color: 'oklch(1 0 0 / 0.45)',
                    fontFamily: MONO,
                    marginTop: 6,
                    letterSpacing: '0.05em',
                }}
            >
                {hint}
            </div>
        </div>
    );
}

function ListSkeleton({ rows }: { rows: number }) {
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: 56,
                        borderRadius: 12,
                        background:
                            'linear-gradient(90deg, oklch(1 0 0 / 0.03), oklch(1 0 0 / 0.06), oklch(1 0 0 / 0.03))',
                        animation: 'admin-shimmer 1.4s infinite',
                        backgroundSize: '200% 100%',
                    }}
                />
            ))}
        </div>
    );
}

function Skeleton({ width, height }: { width: number; height: number }) {
    return (
        <span
            style={{
                display: 'inline-block',
                width,
                height,
                borderRadius: 6,
                background:
                    'linear-gradient(90deg, oklch(1 0 0 / 0.06), oklch(1 0 0 / 0.10), oklch(1 0 0 / 0.06))',
                animation: 'admin-shimmer 1.4s infinite',
                backgroundSize: '200% 100%',
                verticalAlign: 'middle',
            }}
        />
    );
}

function Dot({ color }: { color: string }) {
    return (
        <span
            style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: color,
                display: 'inline-block',
            }}
        />
    );
}

function ArrowSm() {
    return (
        <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
            <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* =============================================================
   Helpers
   ============================================================= */

function microLabel(color: string, size = 10): React.CSSProperties {
    return {
        color,
        fontSize: size,
        fontFamily: MONO,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
    };
}

function fmt(n: number | null): string {
    if (n === null || n === undefined) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('pt-BR');
}

function truncate(s: string, n: number) {
    if (!s) return '';
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function truncateId(s: string) {
    return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function relative(iso?: string | null): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 0) return 'agora';
    if (diff < 60_000) return 'agora';
    if (diff < 3600_000) return `há ${Math.floor(diff / 60_000)} min`;
    if (diff < 86400_000) return `há ${Math.floor(diff / 3600_000)}h`;
    return `há ${Math.floor(diff / 86400_000)}d`;
}
