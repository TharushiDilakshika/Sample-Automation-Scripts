import type { GraphQLDocument } from '../types/graphql';


export function getAvailableInstitutionsQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getAvailableInstitutions($config: Config, $filter: Filter!, $page: Pagination) {
        getAvailableInstitutions(config: $config, filter: $filter, page: $page) {
          id
          institutionId
          createdDate
          branchCode
          branchName
          address
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}

export function checkCorpActionL1ApproveStatusQuery(request?: unknown): GraphQLDocument {
  return {
    query: `
      query checkCorpActionL1ApproveStatus($request: CorpActionApproveCheckInput) {
        checkCorpActionL1ApproveStatus(request: $request)
      }
    `,
    variables: { request },
  };
}

export function checkCorpActionL2ApproveStatusQuery(request?: unknown): GraphQLDocument {
  return {
    query: `
      query checkCorpActionL2ApproveStatus($request: CorpActionApproveCheckInput) {
        checkCorpActionL2ApproveStatus(request: $request)
      }
    `,
    variables: { request },
  };
}

export function getCustomerSellRateQuery(request?: unknown): GraphQLDocument {
  return {
    query: `
      query getCustomerSellRate($request: SellRateRequest!) {
        getCustomerSellRate(request: $request)
      }
    `,
    variables: { request },
  };
}

export function getPendingCorpActionCashDividendsListQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getPendingCorpActionCashDividendsList($config: Config, $filter: Filter!, $page: Pagination) {
        getPendingCorpActionCashDividendsList(config: $config, filter: $filter, page: $page) {
          detailRecId
          masterRecId
          customerId
          customerNo
          customerName
          exchange
          dividendSymbol
          displaySymbol
          cashDividendApprovalStatus
          emailStatus
          executionMode
          currency
          dividendCurrency
          dividendPerShare
          amount
          divAmount
          divTax
          cashAccId
          cashAccountNo
          instId
          institutionId
          investmentId
          nationalId
          createdDate
          date
          lastTradedDate
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}
