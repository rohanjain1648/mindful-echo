import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  RefreshCw,
  BarChart3,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ModerationLog {
  id: string;
  created_at: string;
  source: string;
  content_preview: string;
  is_blocked: boolean;
  is_crisis: boolean;
  risk_level: string;
  violated_policies: string[];
  confidence: number;
  reason: string;
  safe_response_suggestion: string;
  session_id: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

interface DailyMetrics {
  date: string;
  total_checks: number;
  blocked_count: number;
  crisis_count: number;
  high_risk_count: number;
  companion_checks: number;
  assessment_checks: number;
  avg_confidence: number;
}

const ModerationDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isModerator } = useAuth();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'blocked' | 'crisis' | 'unresolved'>('all');

  // Redirect if not admin/moderator
  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isModerator))) {
      toast.error('Access denied. Admin or moderator role required.');
      navigate('/');
    }
  }, [authLoading, user, isAdmin, isModerator, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authorized
  if (!user || (!isAdmin && !isModerator)) {
    return null;
  }

  const fetchData = async () => {
    try {
      // Fetch moderation logs
      let query = supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'blocked') {
        query = query.eq('is_blocked', true);
      } else if (filter === 'crisis') {
        query = query.eq('is_crisis', true);
      } else if (filter === 'unresolved') {
        query = query.is('resolved_at', null).or('is_blocked.eq.true,is_crisis.eq.true');
      }

      const { data: logsData, error: logsError } = await query;
      
      if (logsError) {
        console.error('Error fetching logs:', logsError);
        toast.error('Failed to fetch moderation logs');
      } else {
        setLogs(logsData || []);
      }

      // Fetch daily metrics from view
      const { data: metricsData, error: metricsError } = await supabase
        .from('moderation_metrics_daily')
        .select('*')
        .limit(30);

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
      } else {
        setMetrics(metricsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleResolve = async (logId: string, notes: string) => {
    const { error } = await supabase
      .from('moderation_logs')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: 'admin',
        resolution_notes: notes
      })
      .eq('id', logId);

    if (error) {
      toast.error('Failed to resolve');
    } else {
      toast.success('Marked as resolved');
      fetchData();
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    return source === 'companion' ? <MessageSquare className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  // Calculate summary stats
  const totalLogs = logs.length;
  const blockedCount = logs.filter(l => l.is_blocked).length;
  const crisisCount = logs.filter(l => l.is_crisis).length;
  const unresolvedCount = logs.filter(l => (l.is_blocked || l.is_crisis) && !l.resolved_at).length;

  // Today's metrics
  const todayMetrics = metrics.find(m => {
    const today = new Date().toISOString().split('T')[0];
    return m.date === today;
  });

  // Chart data preparation
  const chartData = useMemo(() => {
    return metrics
      .slice()
      .reverse()
      .slice(-14) // Last 14 days
      .map(m => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: m.total_checks,
        blocked: m.blocked_count,
        crisis: m.crisis_count,
        highRisk: m.high_risk_count,
        companion: m.companion_checks,
        assessment: m.assessment_checks,
        confidence: Math.round((m.avg_confidence || 0) * 100)
      }));
  }, [metrics]);

  // Risk level distribution from logs
  const riskDistribution = useMemo(() => {
    const distribution = logs.reduce((acc, log) => {
      const level = log.risk_level || 'none';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'None', value: distribution['none'] || 0, color: 'hsl(var(--muted-foreground))' },
      { name: 'Low', value: distribution['low'] || 0, color: 'hsl(142, 76%, 36%)' },
      { name: 'Medium', value: distribution['medium'] || 0, color: 'hsl(38, 92%, 50%)' },
      { name: 'High', value: distribution['high'] || 0, color: 'hsl(25, 95%, 53%)' },
      { name: 'Critical', value: distribution['critical'] || 0, color: 'hsl(0, 84%, 60%)' },
    ].filter(d => d.value > 0);
  }, [logs]);

  // Source distribution
  const sourceDistribution = useMemo(() => {
    const companionCount = logs.filter(l => l.source === 'companion').length;
    const assessmentCount = logs.filter(l => l.source === 'assessment').length;
    return [
      { name: 'Companion', value: companionCount, color: 'hsl(var(--primary))' },
      { name: 'Assessment', value: assessmentCount, color: 'hsl(var(--secondary))' },
    ].filter(d => d.value > 0);
  }, [logs]);

  // Policy violations breakdown
  const policyViolations = useMemo(() => {
    const violations: Record<string, number> = {};
    logs.forEach(log => {
      if (log.violated_policies) {
        log.violated_policies.forEach(policy => {
          violations[policy] = (violations[policy] || 0) + 1;
        });
      }
    });
    return Object.entries(violations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [logs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Moderation Dashboard</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Checks (Last 100)</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                {totalLogs}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className={blockedCount > 0 ? 'border-orange-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Blocked Content</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                {blockedCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className={crisisCount > 0 ? 'border-red-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Crisis Alerts</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                {crisisCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className={unresolvedCount > 0 ? 'border-yellow-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Needs Review</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-yellow-500" />
                {unresolvedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Today's Overview */}
        {todayMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
              <CardDescription>Real-time moderation metrics for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{todayMetrics.total_checks}</p>
                  <p className="text-sm text-muted-foreground">Total Checks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{todayMetrics.blocked_count}</p>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{todayMetrics.crisis_count}</p>
                  <p className="text-sm text-muted-foreground">Crisis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round((todayMetrics.avg_confidence || 0) * 100)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Moderation Activity Trend</CardTitle>
              </div>
              <CardDescription>Daily content checks and flagged items over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCrisis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Total Checks"
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="blocked" 
                      name="Blocked"
                      stroke="hsl(38, 92%, 50%)" 
                      fillOpacity={1} 
                      fill="url(#colorBlocked)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="crisis" 
                      name="Crisis"
                      stroke="hsl(0, 84%, 60%)" 
                      fillOpacity={1} 
                      fill="url(#colorCrisis)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No trend data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
              <CardDescription>Breakdown of flagged content by risk severity</CardDescription>
            </CardHeader>
            <CardContent>
              {riskDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No risk data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Content Source</CardTitle>
              <CardDescription>Moderation checks by source type</CardDescription>
            </CardHeader>
            <CardContent>
              {sourceDistribution.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sourceDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" name="Checks" radius={[0, 4, 4, 0]}>
                        {sourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 text-sm">
                    {sourceDistribution.map((source) => (
                      <div key={source.name} className="flex items-center gap-2">
                        {source.name === 'Companion' ? (
                          <MessageSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{source.name}: {source.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No source data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Policy Violations Bar Chart */}
        {policyViolations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Policy Violations</CardTitle>
              <CardDescription>Most frequently triggered content policies</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={policyViolations}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Violations" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Moderation Logs</CardTitle>
                <CardDescription>Review flagged content and take action</CardDescription>
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="blocked">Blocked</TabsTrigger>
                  <TabsTrigger value="crisis">Crisis</TabsTrigger>
                  <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No moderation events found</p>
                  <p className="text-sm">Content safety checks will appear here when flagged</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-lg border ${
                        log.is_crisis ? 'border-red-500/50 bg-red-500/5' :
                        log.is_blocked ? 'border-orange-500/50 bg-orange-500/5' :
                        'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              {getSourceIcon(log.source)}
                              {log.source}
                            </span>
                            {getRiskBadge(log.risk_level)}
                            {log.is_crisis && (
                              <Badge variant="destructive" className="bg-red-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Crisis
                              </Badge>
                            )}
                            {log.is_blocked && !log.is_crisis && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                            {log.resolved_at && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                            "{log.content_preview}"
                          </p>
                          
                          {log.violated_policies && log.violated_policies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {log.violated_policies.map((policy, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {policy}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {log.reason && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Reason:</strong> {log.reason}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                            {log.confidence && (
                              <span>Confidence: {Math.round(log.confidence * 100)}%</span>
                            )}
                            {log.session_id && (
                              <span>Session: {log.session_id.substring(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {!log.resolved_at && (log.is_blocked || log.is_crisis) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(log.id, 'Reviewed and addressed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Historical Metrics */}
        {metrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historical Metrics</CardTitle>
              <CardDescription>Daily moderation activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Date</th>
                      <th className="text-right py-2 px-4">Total</th>
                      <th className="text-right py-2 px-4">Blocked</th>
                      <th className="text-right py-2 px-4">Crisis</th>
                      <th className="text-right py-2 px-4">High Risk</th>
                      <th className="text-right py-2 px-4">Companion</th>
                      <th className="text-right py-2 px-4">Assessment</th>
                      <th className="text-right py-2 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slice(0, 10).map((m) => (
                      <tr key={m.date} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{new Date(m.date).toLocaleDateString()}</td>
                        <td className="text-right py-2 px-4">{m.total_checks}</td>
                        <td className="text-right py-2 px-4 text-orange-500">{m.blocked_count}</td>
                        <td className="text-right py-2 px-4 text-red-500">{m.crisis_count}</td>
                        <td className="text-right py-2 px-4">{m.high_risk_count}</td>
                        <td className="text-right py-2 px-4">{m.companion_checks}</td>
                        <td className="text-right py-2 px-4">{m.assessment_checks}</td>
                        <td className="text-right py-2 px-4">{Math.round((m.avg_confidence || 0) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ModerationDashboard;
