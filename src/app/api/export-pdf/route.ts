import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';
import { ScenarioConfig } from '@/lib/types';

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
  }).optional().default(() => ({
    includeCharts: false,
    includeAssumptions: true,
    includeRecommendations: true
  }))
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

// Helper functions
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

    // Generate PDF using React.createElement
    const doc = React.createElement(
      Document,
      {},
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.title }, 'Policy Analysis Report'),
          React.createElement(Text, { style: styles.subtitle }, 'Isle of Man Vehicle Duty Policy Engine'),
          React.createElement(Text, { style: styles.text }, `Scenario: ${processedScenario.name}`),
          React.createElement(Text, { style: styles.text }, `Generated: ${formatDate(new Date())}`)
        ),
        // Executive Summary
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Executive Summary'),
          React.createElement(Text, { style: styles.text }, processedScenario.description || 'Analysis of proposed vehicle duty policy changes.')
        ),
        // Key Metrics
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Key Financial Metrics'),
          React.createElement(
            View,
            { style: styles.metricRow },
            React.createElement(Text, { style: styles.metricLabel }, 'Total Revenue Change'),
            React.createElement(Text, { style: styles.metricValue }, formatCurrency(results.metrics.totalRevenueChange))
          ),
          React.createElement(
            View,
            { style: styles.metricRow },
            React.createElement(Text, { style: styles.metricLabel }, 'Peak Revenue Gap'),
            React.createElement(Text, { style: styles.metricValue }, formatCurrency(Math.abs(results.metrics.peakRevenueGap)))
          )
        ),
        // Footer
        React.createElement(Text, { style: styles.footer }, 'Generated by Isle of Man Vehicle Duty Policy Engine | Confidential')
      )
    );

    const pdfBlob = await pdf(doc).toBlob();

    // Return PDF as response
    return new NextResponse(pdfBlob, {
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
