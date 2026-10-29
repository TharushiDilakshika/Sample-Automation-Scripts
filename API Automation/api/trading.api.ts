import type { GraphQLClient } from '../common/graphql-client';
import type { GraphQLResponse } from '../types/graphql';
import {
  getOrderQuery,
  getOrderListGridCsvDownloadQuery,
  getOrderListQuery,
  getOrderFeeListQuery,
  getSystemExchangesListQuery,
} from '../graphql/trading.graphql';

export class TradingApi {
  constructor(private readonly gql: GraphQLClient) {}

  async getOrder(filter?: unknown): Promise<GraphQLResponse> {
    const doc = getOrderQuery(filter);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getOrderListGridCsvDownload(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, columnDefinition?: unknown, config?: unknown): Promise<GraphQLResponse> {
    const doc = getOrderListGridCsvDownloadQuery(filter, page, columnDefinition, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getOrderList(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getOrderListQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getOrderFeeList(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getOrderFeeListQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getSystemExchangesList(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getSystemExchangesListQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }
}
