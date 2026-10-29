import type { GraphQLClient } from '../common/graphql-client';
import type { GraphQLResponse } from '../types/graphql';
import {
  getBeneficialOwnerWhsListQuery,
  exportBeneficialOwnerWhsQuery,
} from '../graphql/finance.graphql';

export class FinanceApi {
  constructor(private readonly gql: GraphQLClient) {}

  async getBeneficialOwnerWhsList(filter?: unknown, page?: { pageWidth: number; pageNumber: number }, config?: unknown): Promise<GraphQLResponse> {
    const doc = getBeneficialOwnerWhsListQuery(filter, page, config);
    return this.gql.execute(doc.query, doc.variables);
  }

  async exportBeneficialOwnerWhs(filter?: unknown): Promise<GraphQLResponse> {
    const doc = exportBeneficialOwnerWhsQuery(filter);
    return this.gql.execute(doc.query, doc.variables);
  }
}
