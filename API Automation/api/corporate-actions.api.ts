import type { GraphQLClient } from '../common/graphql-client';
import type { GraphQLResponse } from '../types/graphql';
import {
  getAvailableInstitutionsQuery,
  checkCorpActionL1ApproveStatusQuery,
  checkCorpActionL2ApproveStatusQuery,
  getCustomerSellRateQuery,
  getPendingCorpActionCashDividendsListQuery,
} from '../graphql/corporate-actions.graphql';

export class CorporateActionsApi {
  constructor(private readonly gql: GraphQLClient) {}

  async getAvailableInstitutions(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getAvailableInstitutionsQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async checkCorpActionL1ApproveStatus(request?: unknown): Promise<GraphQLResponse> {
    const doc = checkCorpActionL1ApproveStatusQuery(request);
    return this.gql.execute(doc.query, doc.variables);
  }

  async checkCorpActionL2ApproveStatus(request?: unknown): Promise<GraphQLResponse> {
    const doc = checkCorpActionL2ApproveStatusQuery(request);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getCustomerSellRate(request?: unknown): Promise<GraphQLResponse> {
    const doc = getCustomerSellRateQuery(request);
    return this.gql.execute(doc.query, doc.variables);
  }

  async getPendingCorpActionCashDividendsList(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getPendingCorpActionCashDividendsListQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }
}
