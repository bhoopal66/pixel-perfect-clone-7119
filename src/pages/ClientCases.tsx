import { useState, useEffect } from 'react';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ChevronRight,
  ArrowLeft,
  FolderOpen,
  ClipboardCheck,
  Send,
  Loader2,
  ShieldCheck,
  ShieldX,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { getUserCases, deleteOnboardingCase, type OnboardingCaseSummary } from '@/services/onboardingService';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode; className?: string }> = {
  draft: { label: 'Draft', variant: 'outline', icon: <FolderOpen className="h-3 w-3" />, className: 'border-blue-500/30 text-blue-600 bg-blue-500/10' },
  open: { label: 'Open', variant: 'outline', icon: <FolderOpen className="h-3 w-3" />, className: 'border-blue-500/30 text-blue-600 bg-blue-500/10' },
  checked: { label: 'Checked', variant: 'secondary', icon: <ClipboardCheck className="h-3 w-3" />, className: 'border-violet-500/30 text-violet-600 bg-violet-500/10' },
  in_process: { label: 'In Process', variant: 'secondary', icon: <Loader2 className="h-3 w-3" />, className: 'border-orange-500/30 text-orange-600 bg-orange-500/10' },
  eligible: { label: 'Eligible', variant: 'default', icon: <ShieldCheck className="h-3 w-3" />, className: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' },
  not_eligible: { label: 'Not Eligible', variant: 'destructive', icon: <ShieldX className="h-3 w-3" />, className: 'border-red-500/30 text-red-600 bg-red-500/10' },
  to_submit: { label: 'To Submit', variant: 'outline', icon: <Send className="h-3 w-3" />, className: 'border-amber-500/30 text-amber-600 bg-amber-500/10' },
  submitted: { label: 'Submitted', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, className: 'border-sky-500/30 text-sky-600 bg-sky-500/10' },
  under_process: { label: 'Under Process', variant: 'secondary', icon: <Loader2 className="h-3 w-3" />, className: 'border-orange-500/30 text-orange-600 bg-orange-500/10' },
  approved: { label: 'Approved', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, className: 'border-emerald-500/30 text-emerald-700 bg-emerald-500/15' },
  declined: { label: 'Declined', variant: 'destructive', icon: <XCircle className="h-3 w-3" />, className: 'border-destructive/30 text-destructive bg-destructive/10' },
};

export default function ClientCases() {
  const navigate = useNavigateOnce();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cases, setCases] = useState<OnboardingCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      setIsLoading(true);
      const data = await getUserCases();
      setCases(data);
      setIsLoading(false);
    }
    loadCases();
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className || ''}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">My Applications</h1>
              </div>
            </div>
            <Button onClick={() => navigate('/onboarding')} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Application</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Cases</CardTitle>
            <CardDescription>Track and manage your loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company or case ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_process">In Process</SelectItem>
                  <SelectItem value="eligible">Eligible</SelectItem>
                  <SelectItem value="not_eligible">Not Eligible</SelectItem>
                  <SelectItem value="to_submit">To Submit</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((c) => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{c.caseNumber || '—'}</TableCell>
                          <TableCell className="max-w-[250px] truncate" title={c.companyName}>{c.companyName}</TableCell>
                          <TableCell>{c.loanType}</TableCell>
                          <TableCell className="text-right">
                            {c.loanAmount > 0 ? `AED ${c.loanAmount.toLocaleString()}` : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(c.status)}</TableCell>
                          <TableCell>{format(new Date(c.updatedAt), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/client-cases/${c.id}`)}
                            >
                              Open
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredCases.map((c) => (
                    <Card
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/client-cases/${c.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{c.caseNumber || '—'}</p>
                            <p className="text-base font-semibold truncate" title={c.companyName}>{c.companyName}</p>
                          </div>
                          {getStatusBadge(c.status)}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{c.loanType}</span>
                          <span>{c.loanAmount > 0 ? `AED ${c.loanAmount.toLocaleString()}` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            Updated {format(new Date(c.updatedAt), 'dd MMM yyyy')}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCases.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">No applications found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Start by creating a new application'}
                    </p>
                    <Button onClick={() => navigate('/onboarding')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Application
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
