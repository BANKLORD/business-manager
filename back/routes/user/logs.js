const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const { authenticated, hasPermission, required } = require('../middlewares');
const dayjs = require('dayjs');

async function generateLogsTable(startDate, endDate, companyId = undefined, userId = undefined) {
  const whereQuery = {};
  if ( parseInt(userId) > 0 )
    whereQuery.userId = parseInt(userId);
  if ( parseInt(companyId) > 0 )
    whereQuery.companyId = parseInt(companyId);
  if ( startDate )
    whereQuery.createdAt = { gte: dayjs(startDate).startOf('day').toDate() }
  if ( endDate ) {
    if ( whereQuery.createdAt )
      whereQuery.createdAt.lte = dayjs(endDate).endOf('day').toDate()
    else
      whereQuery.createdAt = { lte: dayjs(endDate).endOf('day').toDate() }
  }
  const logs = await prisma.userLog.findMany({
    // where: {
    //   createdAt: {
    //     gte: startDate,
    //     lte: endDate
    //   }
    // },
    where: whereQuery,
    include: {
      user: true,
      company: true,
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const groupedByYear = groupBy(logs, (log) => log.createdAt.getFullYear());

  const table = {};
  for (const year in groupedByYear) {
    table[year] = {};

    const groupedByMonth = groupBy(groupedByYear[year], (log) => log.createdAt.getMonth());
    for (const month in groupedByMonth) {
      table[year][month] = {};

      const groupedByDay = groupBy(groupedByMonth[month], (log) => log.createdAt.getDate());
      for (const day in groupedByDay) {
        table[year][month][day] = groupedByDay[day];
      }
    }
  }

  return table;
}

function groupBy(array, key) {
  return array.reduce((result, currentValue) => {
    (result[key(currentValue)] = result[key(currentValue)] || []).push(
      currentValue
    );
    return result;
  }, {});
}

router.get(
  "/logs",
  // [ authenticated, hasPermission('logs-read') ],
  async (req, res) => {
    const { startDate, endDate, companyId, userId } = req.query;
    const logs = await generateLogsTable(startDate, endDate, companyId, userId);
    return res.json(logs)
  }
);

module.exports = router;