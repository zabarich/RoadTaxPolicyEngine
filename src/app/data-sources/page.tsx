"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Search, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ExternalLink,
  FileText,
  Calendar,
  Database,
  Shield,
  TrendingUp,
  Users,
  Car,
  DollarSign
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import the data files
import { baselineData } from '@/lib/data/baseline-data';
import { dutyRates } from '@/lib/data/duty-rates';
import { constants } from '@/lib/data/constants';
import { historicalFleetData } from '@/lib/data/historical-fleet';
import { revenueProjectionsData } from '@/lib/data/revenue-projections';

interface DataSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  data: unknown;
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdated: string;
  source: string;
}

const dataSources: DataSource[] = [
  {
    id: 'baseline',
    name: 'Baseline Data',
    icon: <Database className="h-5 w-5" />,
    description: 'Current financial and fleet composition data',
    data: baselineData,
    confidenceLevel: 'high',
    lastUpdated: '2024-01-01',
    source: 'Vehicle Duty Order 2023, Department of Infrastructure'
  },
  {
    id: 'historical',
    name: 'Historical Fleet Data',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'EV adoption trends and growth metrics from 2018-2024',
    data: historicalFleetData,
    confidenceLevel: 'high',
    lastUpdated: '2025-04-24',
    source: 'iomtoday.co.im, Manx Radio'
  },
  {
    id: 'duty-rates',
    name: 'Duty Rate Structure',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Complete vehicle duty rates by category and emissions',
    data: dutyRates,
    confidenceLevel: 'high',
    lastUpdated: '2023-04-01',
    source: 'Vehicle Duty Order 2023 (Official Legislation)'
  },
  {
    id: 'revenue-projections',
    name: 'Revenue Projections',
    icon: <Car className="h-5 w-5" />,
    description: 'Revenue impact scenarios for various EV adoption rates',
    data: revenueProjectionsData,
    confidenceLevel: 'medium',
    lastUpdated: '2024-01-01',
    source: 'Calculated from official government data'
  },
  {
    id: 'constants',
    name: 'Model Constants',
    icon: <Users className="h-5 w-5" />,
    description: 'Configuration values and parameters for policy modeling',
    data: constants,
    confidenceLevel: 'medium',
    lastUpdated: '2024-01-01',
    source: 'Derived from government reports and statistical analysis'
  }
];

// Type guard for checking if data has metadata
const hasMetadata = (data: unknown): data is { metadata: Record<string, unknown> } => {
  return typeof data === 'object' && data !== null && 'metadata' in data;
};

const keyStats = [
  { label: 'Current Vehicle Duty Revenue', value: '£15 million', confidence: 'high' },
  { label: 'Total Vehicles', value: '65,000', confidence: 'high' },
  { label: 'Current EVs', value: '1,500 (2.3%)', confidence: 'high' },
  { label: 'Revenue Loss per EV Conversion', value: '£165', confidence: 'high' },
  { label: '2030 Government Target', value: '13,000 EVs', confidence: 'high' },
];

export default function DataSourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatTableData = (data: unknown): Array<{key: string, value: unknown}> => {
    const flattenObject = (obj: Record<string, unknown>, prefix = ''): Array<{key: string, value: unknown}> => {
      return Object.entries(obj).reduce((acc: Array<{key: string, value: unknown}>, [key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          acc.push(...flattenObject(value as Record<string, unknown>, newKey));
        } else {
          acc.push({ key: newKey, value });
        }
        
        return acc;
      }, []);
    };

    return flattenObject(data as Record<string, unknown>);
  };

  const renderValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.length > 3 ? `Array[${value.length}]` : JSON.stringify(value);
    }
    if (typeof value === 'object' && value !== null) {
      return 'Object';
    }
    return String(value);
  };

  const filteredData = (data: unknown) => {
    if (!searchTerm) return formatTableData(data);
    return formatTableData(data).filter(item => 
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Authoritative Data Sources</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete transparency in our road tax policy modeling. All data sourced from official government 
            publications and verified against independent media reports.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 mr-1" />
              Official Government Data
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <FileText className="h-4 w-4 mr-1" />
              Cross-Referenced Sources
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              <Calendar className="h-4 w-4 mr-1" />
              Regularly Updated
            </Badge>
          </div>
        </div>

        {/* Key Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Key Statistics Overview
            </CardTitle>
            <CardDescription>
              Critical metrics from our authoritative data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {keyStats.map((stat, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs ${getConfidenceColor(stat.confidence)}`}>
                      {getConfidenceIcon(stat.confidence)}
                      <span className="ml-1">{stat.confidence}</span>
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search across all datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Tabs */}
        <Tabs defaultValue="baseline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {dataSources.map((source) => (
              <TabsTrigger key={source.id} value={source.id} className="flex items-center space-x-2">
                {source.icon}
                <span className="hidden sm:inline">{source.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {dataSources.map((source) => (
            <TabsContent key={source.id} value={source.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {source.icon}
                        <span className="ml-2">{source.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {source.description}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadJSON(source.data, source.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download JSON
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Badge className={getConfidenceColor(source.confidenceLevel)}>
                      {getConfidenceIcon(source.confidenceLevel)}
                      <span className="ml-1">Confidence: {source.confidenceLevel}</span>
                    </Badge>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Updated: {source.lastUpdated}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-1" />
                      Source: {source.source}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {/* Metadata */}
                    {hasMetadata(source.data) && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Metadata
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(source.data.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center">
                                <span className="font-medium text-gray-700 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-900">{renderValue(value)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(String(value), `${source.id}-${key}`)}
                                    className="p-1 h-auto"
                                  >
                                    {copiedField === `${source.id}-${key}` ? 
                                      <CheckCircle className="h-3 w-3 text-green-600" /> : 
                                      <Copy className="h-3 w-3" />
                                    }
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Table */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Complete Dataset
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Field</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Value</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {filteredData(source.data).map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                    {item.key}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                    {renderValue(item.value)}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(String(item.value), `${source.id}-${item.key}`)}
                                      className="p-1 h-auto"
                                    >
                                      {copiedField === `${source.id}-${item.key}` ? 
                                        <CheckCircle className="h-3 w-3 text-green-600" /> : 
                                        <Copy className="h-3 w-3" />
                                      }
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Raw JSON Viewer */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Raw JSON Data
                      </h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{JSON.stringify(source.data, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Provenance Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Data Provenance & Sources
            </CardTitle>
            <CardDescription>
              Complete documentation of data origins and verification methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Official Government Sources */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Official Government Sources
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Vehicle Duty Order 2023</div>
                    <div className="text-sm text-gray-600">Official legislation defining all vehicle duty rates</div>
                    <Badge className="mt-1 bg-green-100 text-green-800">Legislative Authority</Badge>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Department of Infrastructure Reports 2024/25</div>
                    <div className="text-sm text-gray-600">Budget allocations and roads maintenance data</div>
                    <Badge className="mt-1 bg-green-100 text-green-800">Departmental Data</Badge>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Treasury Budget Documents</div>
                    <div className="text-sm text-gray-600">Government revenue and expenditure planning</div>
                    <Badge className="mt-1 bg-green-100 text-green-800">Financial Authority</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Sources */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-700">
                <ExternalLink className="h-5 w-5 mr-2" />
                Media Sources (Verification)
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Manx Radio - February 11, 2023</div>
                    <div className="text-sm text-gray-600">Vehicle duty increase announcement and EV policy changes</div>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">News Verification</Badge>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">iomtoday.co.im - March 2023 to April 2025</div>
                    <div className="text-sm text-gray-600">Ongoing EV adoption reporting and statistical updates</div>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">Continuous Coverage</Badge>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">&ldquo;Isle of Man sees 1,176% rise in EV ownership since 2018&rdquo;</div>
                    <div className="text-sm text-gray-600">iomtoday.co.im - April 24, 2025</div>
                    <Badge className="mt-1 bg-purple-100 text-purple-800">Key Statistical Source</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Collection Methodology */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center text-purple-700">
                <Database className="h-5 w-5 mr-2" />
                Data Collection Methodology
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Primary Source Compilation</div>
                    <div className="text-sm text-gray-600">
                      All financial and legislative data compiled directly from official government publications
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Cross-Reference Validation</div>
                    <div className="text-sm text-gray-600">
                      News reports used to validate and confirm official figures and policy implementations
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Derived Calculations</div>
                    <div className="text-sm text-gray-600">
                      All revenue projections and impact assessments calculated from verified official figures
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Quality Indicators */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Data Quality & Confidence Levels
            </CardTitle>
            <CardDescription>
              Transparency about data reliability and verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">High Confidence</span>
                </div>
                <div className="text-sm text-gray-600">
                  Data sourced directly from official government legislation or departmental reports.
                  Verified through multiple independent media sources.
                </div>
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    Legislative data, current revenue figures, vehicle counts
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Medium Confidence</span>
                </div>
                <div className="text-sm text-gray-600">
                  Calculated projections based on official data using established methodologies.
                  Assumptions clearly documented.
                </div>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    Revenue projections, adoption scenarios, modeling constants
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Verification Status</span>
                </div>
                <div className="text-sm text-gray-600">
                  All data last verified within 6 months. Historical data validated against 
                  contemporary news reports from the time periods.
                </div>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    Latest update: January 2024 (with April 2025 EV statistics)
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citation Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              How to Cite This Data
            </CardTitle>
            <CardDescription>
              Academic and professional citation formats for referencing this data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">APA Format:</h4>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                Isle of Man Road Tax Policy Engine. (2024). <em>Authoritative Data Sources for EV Policy Analysis</em>. 
                Retrieved from [URL]. Original data: Vehicle Duty Order 2023, Department of Infrastructure Reports 2024/25.
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => copyToClipboard(
                  'Isle of Man Road Tax Policy Engine. (2024). Authoritative Data Sources for EV Policy Analysis. Retrieved from [URL]. Original data: Vehicle Duty Order 2023, Department of Infrastructure Reports 2024/25.',
                  'apa-citation'
                )}
              >
                {copiedField === 'apa-citation' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy APA Citation
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Chicago Format:</h4>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                &ldquo;Isle of Man Road Tax Policy Engine - Data Sources.&rdquo; Accessed [Date]. 
                Based on Vehicle Duty Order 2023 and Department of Infrastructure Reports 2024/25. [URL].
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => copyToClipboard(
                  'Isle of Man Road Tax Policy Engine - Data Sources. Accessed [Date]. Based on Vehicle Duty Order 2023 and Department of Infrastructure Reports 2024/25. [URL].',
                  'chicago-citation'
                )}
              >
                {copiedField === 'chicago-citation' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy Chicago Citation
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Attribution:</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                This policy analysis uses official data from the Isle of Man Government Vehicle Duty Order 2023, 
                Department of Infrastructure budget reports 2024/25, and statistical data verified through 
                independent media sources including Manx Radio and iomtoday.co.im.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
