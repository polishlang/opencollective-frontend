import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import ProportionalAreaChart from '../../ProportionalAreaChart';
import { P, Span } from '../../Text';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const getChartOptions = (intl, category, dateFrom, dateTo) => {
  return {
    chart: {
      id: 'chart-transactions-overview',
    },
    legend: {
      show: true,
      horizontalAlign: 'left',
    },
    colors: ['#29CC75', '#F55882'],
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    stroke: {
      curve: 'straight',
      width: 1.5,
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
    },

    xaxis: {
      categories: getCategories(intl, category, dateFrom, dateTo),
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return value < 1000 ? value : `${Math.round(value / 1000)}k`;
        },
      },
    },
  };
};

const getCategories = (intl, category, dateFrom, dateTo) => {
  if (category === 'DAY') {
    const numberOfDays = dateTo.diff(dateFrom, 'day', false) + 1;
    const startingDay = dateFrom.utc().date();
    const startingMonth = dateFrom.utc().month();
    const startingYear = dateFrom.utc().year();
    return [...new Array(numberOfDays)].map((_, idx) =>
      intl
        .formatDate(new Date(startingYear, startingMonth, startingDay + idx), { day: 'numeric', month: 'short' })
        .toUpperCase(),
    );
  } else if (category === 'MONTH') {
    const startingMonth = dateFrom.utc().month();
    const startingYear = dateFrom.utc().year();
    const numberOfMonths = dateTo.diff(dateFrom, 'month', false) + 1;
    return [...new Array(numberOfMonths)].map((_, idx) =>
      intl.formatDate(new Date(startingYear, idx + startingMonth), { month: 'short', year: '2-digit' }).toUpperCase(),
    );
  } else if (category === 'YEAR') {
    const numberOfYears = dateTo.diff(dateFrom, 'year', false);
    return [...new Array(numberOfYears)].map((_, idx) =>
      intl
        .formatDate(new Date(new Date().getUTCFullYear() - numberOfYears + 1 + idx, 0), { year: 'numeric' })
        .toUpperCase(),
    );
  }
};

const constructChartDataPoints = (category, dataPoints, dateFrom, dateTo) => {
  let chartDataPoints;

  // Show data aggregated yearly
  if (category === 'YEAR') {
    const numberOfYears = dateTo.diff(dateFrom, 'year', false);
    chartDataPoints = new Array(numberOfYears).fill(0);
    const currentYear = dayjs().utc().year();
    dataPoints.forEach(dataPoint => {
      const year = dayjs(dataPoint.date).utc().year();
      if (year > currentYear - numberOfYears) {
        chartDataPoints[numberOfYears - 1 - (currentYear - year)] = Math.abs(dataPoint.amount.value);
      }
    });
    // Show data aggregated monthly
  } else if (category === 'MONTH') {
    const numberOfMonths = dateTo.diff(dateFrom, 'month', false) + 1;
    chartDataPoints = new Array(numberOfMonths).fill(0);
    const startYear = dateFrom.utc().year();
    const startMonth = dateFrom.utc().month();
    dataPoints.forEach(dataPoint => {
      const month = dayjs(dataPoint.date).utc().month();
      const year = dayjs(dataPoint.date).utc().year();
      chartDataPoints[month - startMonth + 12 * (year - startYear)] = Math.abs(dataPoint.amount.value);
    });
    // Show data aggregated by day
  } else if (category === 'DAY') {
    const numberOfDays = dateTo.diff(dateFrom, 'day', false) + 1;
    chartDataPoints = new Array(numberOfDays).fill(0);
    const startDay = dateFrom.utc();
    dataPoints.forEach(dataPoint => {
      const currentDay = dayjs(dataPoint.date).utc();
      chartDataPoints[Math.ceil(currentDay.diff(startDay, 'day', true))] = Math.abs(dataPoint.amount.value);
    });
  }

  return chartDataPoints;
};

const getTransactionsAreaChartData = (host, locale) => {
  if (!host) {
    return [];
  }

  const currency = host.currency;
  const { contributionsCount, dailyAverageIncomeAmount } = host.contributionStats;
  const { expensesCount, dailyAverageAmount } = host.expenseStats;
  return [
    {
      key: 'contributions',
      percentage: 0.5,
      color: 'green.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <FormattedMessage
            defaultMessage="{count, plural, one {# contribution} other {# contributions}}"
            values={{ count: contributionsCount }}
          />
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage
            defaultMessage="Daily average: {amount}"
            values={{
              amount: <strong>{formatCurrency(dailyAverageIncomeAmount.valueInCents, currency, { locale })}</strong>,
            }}
          />
        </P>
      ),
    },
    {
      key: 'expenses',
      percentage: 0.5,
      color: 'red.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <FormattedMessage
            defaultMessage="{count, plural, one {# expense} other {# expenses}}"
            values={{ count: expensesCount }}
          />
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage
            defaultMessage="Daily average: {amount}"
            values={{
              amount: <strong>{formatCurrency(dailyAverageAmount.valueInCents, currency, { locale })}</strong>,
            }}
          />
        </P>
      ),
    },
  ];
};

const getTransactionsBreakdownChartData = host => {
  if (!host) {
    return [];
  }

  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;
  const { recurringContributionsCount, oneTimeContributionsCount } = contributionStats;
  const { invoicesCount, reimbursementsCount, grantsCount } = expenseStats;
  const hasGrants = grantsCount > 0;
  const areas = [
    {
      key: 'one-time',
      percentage: 0.25,
      color: 'green.400',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# One-time} other {# One-time}}"
          values={{ count: oneTimeContributionsCount }}
        />
      ),
    },
    {
      key: 'recurring',
      percentage: 0.25,
      color: 'green.300',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Recurring} other {# Recurring}}"
          values={{ count: recurringContributionsCount }}
        />
      ),
    },
    {
      key: 'invoices',
      percentage: hasGrants ? 0.166 : 0.25,
      color: 'red.600',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Invoice} other {# Invoices}}"
          values={{ count: invoicesCount }}
        />
      ),
    },
    {
      key: 'receipts',
      percentage: hasGrants ? 0.166 : 0.25,
      color: 'red.400',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Reimbursement} other {# Reimbursements}}"
          values={{ count: reimbursementsCount }}
        />
      ),
    },
  ];

  // Grants are only enabled for a few hosts/collectives, we only display the metric if active
  if (hasGrants) {
    areas.push({
      key: 'grants',
      percentage: 0.166,
      color: 'red.300',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Grant} other {# Grants}}"
          values={{ count: grantsCount }}
        />
      ),
    });
  }

  return areas;
};

const TransactionsOverviewSection = ({ host, isLoading, dateInterval }) => {
  const intl = useIntl();
  const { locale } = intl;
  const dateFrom = dateInterval.from ? dayjs(dateInterval.from) : dayjs(host?.createdAt);
  const dateTo = dateInterval.to ? dayjs(dateInterval.to) : dayjs();

  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;

  const { contributionAmountOverTime } = contributionStats || 0;
  const { expenseAmountOverTime } = expenseStats || 0;
  const categoryType = contributionAmountOverTime?.timeUnit;

  const series = [
    {
      name: 'Contributions',
      data: contributionAmountOverTime
        ? constructChartDataPoints(categoryType, contributionAmountOverTime.nodes, dateFrom, dateTo)
        : null,
    },
    {
      name: 'Expenses',
      data: expenseAmountOverTime
        ? constructChartDataPoints(categoryType, expenseAmountOverTime.nodes, dateFrom, dateTo)
        : null,
    },
  ];

  const areaChartData = React.useMemo(() => getTransactionsAreaChartData(host, locale), [host, locale]);
  const transactionBreakdownChart = React.useMemo(() => getTransactionsBreakdownChartData(host), [host]);
  return (
    <React.Fragment>
      <Box mt={18} mb={12}>
        {isLoading ? (
          <LoadingPlaceholder height="98px" borderRadius="8px" />
        ) : (
          <div>
            <ProportionalAreaChart areas={areaChartData} borderRadius="6px 6px 0 0" />
            <ProportionalAreaChart areas={transactionBreakdownChart} borderRadius="0 0 6px 6px" />
          </div>
        )}
      </Box>
      <Box mt="24px" mb="12px">
        {isLoading ? (
          <LoadingPlaceholder height={21} width="100%" borderRadius="8px" />
        ) : (
          <Chart
            type="area"
            width="100%"
            height="250px"
            options={getChartOptions(intl, categoryType, dateFrom, dateTo)}
            series={series}
          />
        )}
      </Box>
    </React.Fragment>
  );
};

TransactionsOverviewSection.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    createdAt: PropTypes.string,
    contributionStats: PropTypes.shape({
      contributionsCount: PropTypes.number,
      oneTimeContributionsCount: PropTypes.number,
      recurringContributionsCount: PropTypes.number,
      dailyAverageIncomeAmount: PropTypes.shape({
        value: PropTypes.number,
      }),
    }),
    expenseStats: PropTypes.shape({
      expensesCount: PropTypes.number,
      invoicesCount: PropTypes.number,
      reimbursementsCount: PropTypes.number,
      grantsCount: PropTypes.number,
      dailyAverageAmount: PropTypes.shape({
        value: PropTypes.number,
      }),
    }),
  }),
  dateInterval: PropTypes.object,
};

export default TransactionsOverviewSection;
