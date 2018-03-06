const _ = require('lodash');
const authEnsure = require('connect-ensure-login');
const db = require('../models/');
const express = require('express');

const ensureLoggedIn = authEnsure.ensureLoggedIn('/login');

const router = express.Router();

module.exports = () => {
  router.all('/server/create', (req, res) => {

  });

  router.all('/server/:serverId/edit', (req, res) => {

  });

  router.get('/server/:serverId/delete', async(req, res) => {
    const isOwner = req.user && req.user.id === req.server.userId;

    if (!isOwner) {
      return res.status(400).send('Not your server');
    } else if (req.server.inUse) {
      return res.status(400).send('Cannot delete server when in use');
    }

    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      const servers = await db.Matches.findAll({
        where: {
          serverId: req.server.id
        }
      }, { transaction });

      _.forEach(servers, (server) => {
        server.updateAttributes({ serverId: null });
      });

      await req.server.destroy({ transaction });
      await transaction.commit();

      return res.redirect('/myservers');
    } catch (e) {
      await transaction.rollback();

      return res.status(400).send('Failed to delete server');
    }
  });

  router.get('/myservers', ensureLoggedIn, async(req, res) => {
    const servers = await db.GameServers.findAll({
      where: {
        user_id: req.session.user_id
      },
      order: [
        ['id', 'DESC']
      ],
      limit: 50
    });

    return res.render('servers', {
      servers
    });
  });

  router.param('serverId', async(req, res, next, id) => {
    const serverId = req.params.serverId;

    const server = await db.GameServers.findById(serverId);

    if (!server) {
      return res.status(404).end('Not found');
    }

    req.server = server;

    next();
  });

  return router;
};
