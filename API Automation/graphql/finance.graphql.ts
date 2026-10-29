import type { GraphQLDocument } from '../types/graphql';


export function getBeneficialOwnerWhsListQuery(filter: unknown = [], page = { pageWidth: 10, pageNumber: 1 }, config?: unknown): GraphQLDocument {
  return {
    query: `
      query getBeneficialOwnerWhsList($config: Config, $filter: Filter!, $page: Pagination) {
        getBeneficialOwnerWhsList(config: $config, filter: $filter, page: $page) {
          accountHolderName
          capitalGainReturnOfCapitalRate
          chapter3Status
          chapter4Status
          chapter4WithholdingRate
          countryOfIncorporation
          countryOfTaxResidence
          dividendIncomeRate
          effectiveDate
          ein
          endUserAccountNumber
          foreignTin
          giin
          institutionId
          institutionName
          intermediaryGiin
          nonPortfolioInterestIncomeRate
          permanentResidentialAddress
          portfolioInterestIncomeRate
          reitsIncomeRate
          s1446fPtpDistributionWithholdingRate
          s1446fPtpTransfersRate
          subAccountInternalId
          substituteDividendIncomeRate
          substituteInterestIncomeRate
          uniqueIdentifierMasterAccount
          usNonUsStatus
          wFormDocumentation
          __typename
        }
      }
    `,
    variables: { filter, page, config },
  };
}

export function exportBeneficialOwnerWhsQuery(filter?: unknown): GraphQLDocument {
  return {
    query: `
      query exportBeneficialOwnerWhs($filter: Filter) {
        exportBeneficialOwnerWhs(filter: $filter) {
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
    variables: { filter },
  };
}
