import type { GraphQLClient } from '../common/graphql-client';
import type { GraphQLResponse } from '../types/graphql';
import {
  getFundStrategyListGridCsvDownloadQuery,
  getFundHoldingsArchiveSummaryGridCsvDownloadQuery,
  getFundHoldingsMasterListGridCsvDownloadQuery,
  getShortSellClientStockListGridCsvDownloadQuery,
} from '../graphql/report.graphql';

export class ReportApi {
  constructor(private readonly gql: GraphQLClient) {}

  async getFundStrategyListGridCsvDownload(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, columnDefinition?: unknown, config?: unknown): Promise<GraphQLResponse> {
    const doc = getFundStrategyListGridCsvDownloadQuery(filter, page, columnDefinition, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getFundHoldingsArchiveSummaryGridCsvDownload(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, columnDefinition?: unknown, config?: unknown): Promise<GraphQLResponse> {
    const doc = getFundHoldingsArchiveSummaryGridCsvDownloadQuery(filter, page, columnDefinition, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getFundHoldingsMasterListGridCsvDownload(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, columnDefinition?: unknown, config?: unknown): Promise<GraphQLResponse> {
    const doc = getFundHoldingsMasterListGridCsvDownloadQuery(filter, page, columnDefinition, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getShortSellClientStockListGridCsvDownload(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, columnDefinition?: unknown, config?: unknown): Promise<GraphQLResponse> {
    const doc = getShortSellClientStockListGridCsvDownloadQuery(filter, page, columnDefinition, config);
    return this.gql.execute(doc.query, doc.variables);
  }
}
