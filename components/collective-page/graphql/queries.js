import { gql } from '@apollo/client';

import { gqlV2 } from '../../../lib/graphql/helpers';

import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../../contribute-cards/Contribute';
import { expensesListFieldsFragment } from '../../expenses/graphql/fragments';
import { transactionsQueryCollectionFragment } from '../../transactions/graphql/fragments';

import * as fragments from './fragments';

// We have to disable the linter because it's not able to detect that `nbContributorsPerContributeCard` is used in fragments
/* eslint-disable graphql/template-strings */
export const collectivePageQuery = gql`
  query CollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
    Collective(slug: $slug, throwIfMissing: false) {
      id
      slug
      path
      name
      description
      longDescription
      backgroundImage
      backgroundImageUrl
      twitterHandle
      githubHandle
      website
      tags
      company
      type
      currency
      settings
      isActive
      isPledged
      isApproved
      isArchived
      isHost
      isIncognito
      isGuest
      hostFeePercent
      platformFeePercent
      image
      imageUrl(height: 256)
      canApply
      canContact
      features {
        ...NavbarFields
      }
      ordersFromCollective(subscriptionsOnly: true) {
        isSubscriptionActive
      }
      memberOf(onlyActiveCollectives: true, limit: 1) {
        id
      }
      stats {
        id
        balance
        balanceWithBlockedFunds
        yearlyBudget
        updates
        activeRecurringContributions
        totalAmountReceived(periodInMonths: 12)
        totalAmountRaised: totalAmountReceived
        totalNetAmountRaised: totalNetAmountReceived
        backers {
          id
          all
          users
          organizations
        }
        transactions {
          all
        }
      }
      connectedTo: memberOf(role: "CONNECTED_COLLECTIVE", limit: 1) {
        id
        collective {
          id
          name
          type
          slug
        }
      }
      parentCollective {
        id
        name
        slug
        image
        backgroundImageUrl
        twitterHandle
        type
        coreContributors: contributors(roles: [ADMIN, MEMBER]) {
          ...ContributorsFields
        }
      }
      host {
        id
        name
        slug
        type
        settings
        plan {
          id
          hostFees
          hostFeeSharePercent
        }
        features {
          id
          VIRTUAL_CARDS
        }
      }
      coreContributors: contributors(roles: [ADMIN, MEMBER]) {
        ...ContributorsFields
      }
      financialContributors: contributors(roles: [BACKER], limit: 150) {
        ...ContributorsFields
      }
      tiers {
        ...ContributeCardTierFields
      }
      events(includePastEvents: true, includeInactive: true) {
        ...ContributeCardEventFields
      }
      projects {
        ...ContributeCardProjectFields
      }
      connectedCollectives: members(role: "CONNECTED_COLLECTIVE") {
        id
        collective: member {
          id
          slug
          name
          type
          description
          backgroundImageUrl(height: 208)
          stats {
            id
            backers {
              id
              all
              users
              organizations
            }
          }
          contributors(limit: $nbContributorsPerContributeCard) {
            ...ContributeCardContributorFields
          }
        }
      }
      updates(limit: 3, onlyPublishedUpdates: true) {
        ...UpdatesFields
      }
      plan {
        id
        hostedCollectives
      }

      ... on Event {
        timezone
        startsAt
        endsAt
        location {
          name
          address
          country
          lat
          long
        }
        privateInstructions
        orders {
          id
          createdAt
          quantity
          publicMessage
          fromCollective {
            id
            type
            name
            company
            image
            imageUrl
            slug
            twitterHandle
            description
            ... on User {
              email
            }
          }
          tier {
            id
            name
            type
          }
        }
      }
    }
  }

  ${fragments.updatesFieldsFragment}
  ${fragments.contributorsFieldsFragment}
  ${fragments.collectiveNavbarFieldsFragment}
  ${fragments.contributeCardTierFieldsFragment}
  ${fragments.contributeCardEventFieldsFragment}
  ${fragments.contributeCardProjectFieldsFragment}
`;
/* eslint-enable graphql/template-strings */

export const budgetSectionQuery = gqlV2/* GraphQL */ `
  query BudgetSection($slug: String!, $limit: Int!, $kind: [TransactionKind]) {
    transactions(account: { slug: $slug }, limit: $limit, hasExpense: false, kind: $kind) {
      ...TransactionsQueryCollectionFragment
    }
    expenses(account: { slug: $slug }, limit: $limit) {
      totalCount
      nodes {
        ...ExpensesListFieldsFragment
      }
    }
    account(slug: $slug) {
      id
      stats {
        id
        balance {
          valueInCents
          currency
        }
        yearlyBudget {
          valueInCents
          currency
        }
        activeRecurringContributions
        totalAmountReceived(periodInMonths: 12) {
          valueInCents
          currency
        }
        totalAmountRaised: totalAmountReceived {
          valueInCents
          currency
        }
        totalNetAmountRaised: totalNetAmountReceived {
          valueInCents
          currency
        }
      }
    }
  }
  ${transactionsQueryCollectionFragment}
  ${expensesListFieldsFragment}
`;

export const getCollectivePageQueryVariables = slug => {
  return {
    slug: slug,
    nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
  };
};
