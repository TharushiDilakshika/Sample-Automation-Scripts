import type { GraphQLDocument } from '../types/graphql';

export function getOrderQuery(filter: unknown = []): GraphQLDocument {
  return {
    query: `
      query getOrder($filter: Filter!) {
        getOrder(filter: $filter) {
          orderId
          clientOrderId
          executionId
          frontOfficeOrderId
          c1CustomerId
          customerId
          customerName
          cashAccountNo
          accountNo
          institutionId
          orderStatus
          orderType
          side
          symbol
          symbolDescription
          exchange
          currency
          isinCode
          orderQuantity
          price
          orderValue
          executedQuanity
          executedOrderValue
          executedCommission
          executedNetsettle
          lastpx
          brokerCommission
          costCommission
          orderFee
          totalVatAmount
          totalCost
          totalRevenue
          createdDate
          lastUpdated
          expireTime
          channel
          tifType
          marketCode
          service
          marginOrder
          rejectReason
          dealerName
          externalRefNo
          execBrokerSid
          __typename
        }
      }
    `,
    variables: { filter },
  };
}

export function getOrderListGridCsvDownloadQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, columnDefinition?: unknown, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getOrderListGridCsvDownload($columnDefinition: ColumnDefinition!, $config: Config, $filter: Filter!, $page: Pagination) {
        getOrderListGridCsvDownload(columnDefinition: $columnDefinition, config: $config, filter: $filter, page: $page) {
          __typename
        }
      }
    `,
    variables: { filter, page, columnDefinition, config },
  };
}

export function getOrderListQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getOrderList($config: Config, $filter: Filter!, $page: Pagination) {
        getOrderList(config: $config, filter: $filter, page: $page) {
          c1CustomerId
          clientOrderId
          customerId
          execBrokerSid
          executionId
          frontOfficeOrderId
          institutionId
          orderId
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}

export function getOrderFeeListQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getOrderFeeList($config: Config, $filter: Filter!, $page: Pagination) {
        getOrderFeeList(config: $config, filter: $filter, page: $page) {
          cashAccountId
          feeId
          institutionId
          securityAccountId
          transactionId
          amtInSettleCurrency
          amtInTransCurrency
          applicableFor
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}

export function getSystemExchangesListQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getSystemExchangesList($config: Config, $filter: Filter!, $page: Pagination) {
        getSystemExchangesList(config: $config, filter: $filter, page: $page) {
          id
          exchangeCode
          activeStatus
          activeStatusText
          countryCode
          countryName
          defaultCurrency
          description1
          editableStatus
          allowInternalMatching
          dayTradingAllowed
          locationId
          packageId
          statusId
          vatGroupId
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}
