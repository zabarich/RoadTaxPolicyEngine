import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { ScenarioConfig, ScenarioResults } from '@/lib/types';
import React from 'react';

// Validation schema for PDF export request
const ExportPDFSchema = z.object({
  scenario: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(),
    parameters: z.any() // Full validation would be complex here
  }),
  results: z.any(), // Full validation would be complex here
  template: z.enum(['executive', 'detailed', 'technical']).default('executive'),
  options: z.object({
    includeCharts: z.boolean().default(false),
    includeAssumptions: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true)
  }).optional().default({})
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1f2937'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151'
  },
  text: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 5
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280'
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  warningBox: {
    backgroundColor: '#fef3cd',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10
  },
  warningText: {
    fontSize: 10,
    color: '#92400e'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af'
  }
});

// PDF Component
const PolicyReport: React.FC<{
  scenario: ScenarioConfig;
  results: ScenarioResults;
  template: string;
  options: any;
}> = ({ scenario, results, template, options }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Policy Analysis Report</Text>
          <Text style={styles.subtitle}>
            Isle of Man Vehicle Duty Policy Engine
          </Text>
          <Text style={styles.text}>
            Scenario: {scenario.name}
          </Text>
          <Text style={styles.text}>
            Generated: {formatDate(new Date())}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.text}>
            {scenario.description || 'Analysis of proposed vehicle duty policy changes and their projected impact on revenue, fleet composition, and EV adoption targets.'}
          </Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Financial Metrics</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Revenue Change</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(results.metrics.totalRevenueChange)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Peak Revenue Gap</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(Math.abs(results.metrics.peakRevenueGap))}
            </Text>
          </View>

          {results.revenue.breakEvenYear && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Break-even Year</Text>
              <Text style={styles.metricValue}>
                {results.revenue.breakEvenYear}
              </Text>
            </View>
          )}

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>2030 Target Achievement</Text>
            <Text style={styles.metricValue}>
              {results.impacts.meetsTargets ? 
                `Yes (${results.metrics.targetAchievementYear})` : 
                'Not Met'
              }
            </Text>
          </View>
        </View>

        {/* Policy Parameters */}
        {template !== 'executive' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Parameters</Text>
            
            <Text style={styles.text}>
              Timeline: {scenario.parameters.timeline.startYear} - {scenario.parameters.timeline.endYear}
            </Text>
            
            <Text style={styles.text}>
              Adoption Model: {scenario.parameters.adoptionModel.type}
            </Text>
            
            <Text style={styles.text}>
              Price Elasticity: {scenario.parameters.adoptionModel.priceElasticity}
            </Text>

            <Text style={styles.text}>
              2030 EV Target: {Object.values(scenario.parameters.adoptionModel.targetEVCount)[0]?.toLocaleString() || 'N/A'} vehicles
            </Text>
          </View>
        )}

        {/* Warnings and Risks */}
        {results.metrics.peakRevenueGap > 1000000 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ CRITICAL: Revenue loss exceeds £1M annually. Consider policy adjustments.
            </Text>
          </View>
        )}

        {!results.impacts.meetsTargets && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ WARNING: Policy does not achieve 2030 EV adoption targets.
            </Text>
          </View>
        )}

        {/* Recommendations */}
        {options.includeRecommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            
            {results.metrics.peakRevenueGap > 1000000 ? (
              <Text style={styles.text}>
                • Consider phased duty rate increases to reduce revenue shock
              </Text>
            ) : (
              <Text style={styles.text}>
                • Revenue impact is manageable within projected parameters
              </Text>
            )}

            {!results.impacts.meetsTargets ? (
              <Text style={styles.text}>
                • Enhance EV incentives or adjust adoption curve assumptions
              </Text>
            ) : (
              <Text style={styles.text}>
                • Policy supports achievement of 2030 EV targets
              </Text>
            )}

            <Text style={styles.text}>
              • Monitor quarterly adoption rates against projections
            </Text>
            
            <Text style={styles.text}>
              • Consider implementing progressive duty mechanisms based on vehicle weight or usage
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Isle of Man Vehicle Duty Policy Engine | Confidential
        </Text>
      </Page>
    </Document>
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    const validation = ExportPDFSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid export request',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { scenario, results, template, options } = validation.data;

    // Convert string dates back to Date objects
    const processedScenario = {
      ...scenario,
      createdAt: new Date(scenario.createdAt)
    } as ScenarioConfig;

    // Generate PDF
    const doc = React.createElement(PolicyReport, {
      scenario: processedScenario,
      results: results as ScenarioResults,
      template,
      options
    });

    const pdfBuffer = await pdf(doc).toBuffer();

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="policy_report_${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
