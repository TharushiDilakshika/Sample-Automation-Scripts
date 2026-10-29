import type { GraphQLDocument } from '../types/graphql';


export function getFundStrategyListGridCsvDownloadQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, columnDefinition?: unknown, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getFundStrategyListGridCsvDownload($columnDefinition: ColumnDefinition!, $config: Config, $filter: Filter!, $page: Pagination) {
        getFundStrategyListGridCsvDownload(columnDefinition: $columnDefinition, config: $config, filter: $filter, page: $page) {
          message {
            template
            keys {
              key
              value
            }
          }
          __typename
        }
      }
    `,
    variables: { filter, page, columnDefinition, config },
  };
}

export function getFundHoldingsArchiveSummaryGridCsvDownloadQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, columnDefinition?: unknown, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getFundHoldingsArchiveSummaryGridCsvDownload($columnDefinition: ColumnDefinition!, $config: Config, $filter: Filter!, $page: Pagination) {
        getFundHoldingsArchiveSummaryGridCsvDownload(columnDefinition: $columnDefinition, config: $config, filter: $filter, page: $page) {
          message {
            template
            keys {
              key
              value
            }
          }
          __typename
        }
      }
    `,
    variables: { filter, page, columnDefinition, config },
  };
}

export function getFundHoldingsMasterListGridCsvDownloadQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, columnDefinition?: unknown, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getFundHoldingsMasterListGridCsvDownload($columnDefinition: ColumnDefinition!, $config: Config, $filter: Filter!, $page: Pagination) {
        getFundHoldingsMasterListGridCsvDownload(columnDefinition: $columnDefinition, config: $config, filter: $filter, page: $page) {
          message {
            template
            keys {
              key
              value
            }
          }
          __typename
        }
      }
    `,
    variables: { filter, page, columnDefinition, config },
  };
}

export function getShortSellClientStockListGridCsvDownloadQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, columnDefinition?: unknown, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getShortSellClientStockListGridCsvDownload($columnDefinition: ColumnDefinition!, $config: Config, $filter: Filter!, $page: Pagination) {
        getShortSellClientStockListGridCsvDownload(columnDefinition: $columnDefinition, config: $config, filter: $filter, page: $page) {
          message {
            template
            keys {
              key
              value
            }
          }
          __typename
        }
      }
    `,
    variables: { filter, page, columnDefinition, config },
  };
}
