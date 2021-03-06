import express from 'express';
import { SupportRequest, SupportRequestStatus, SupportRequestType } from '../entities/supportRequest';
import logger from '../logger';
import messageUsers from '../slack/utilities/messageUsers';

export const supportRequestRoutes = express.Router();

export interface NextSupportRequestResponse {
  supportRequest: SupportRequest;
  userNotified: boolean;
}

supportRequestRoutes.post('/getNext', async (req, res) => {
  let nextRequest;
  try {
    nextRequest = await SupportRequest.getNextSupportRequest();
  } catch (err) {
    res.status(500).send('Something went wrong trying to get the next support request');
    logger.error('Something went wrong trying to get the next support request', err);
    return;
  }

  let userNotified = false;
  try {
    if (nextRequest) {
      await messageUsers(
        [nextRequest.slackId],
        `:tada: We're ready to ${
          nextRequest.type === SupportRequestType.IdeaPitch ? 'help you with an idea' : 'help with your technical issue'
        }, so head over to our booth. Feel free to bring other members of your team and make sure to bring your laptop if relevant.`,
      );
      userNotified = true;
    }
  } catch (err) {
    logger.error("Unable to notify users they're support request has been served", err);
  }

  const response: NextSupportRequestResponse = {
    userNotified,
    supportRequest: nextRequest,
  };
  res.send(response);
});

supportRequestRoutes.post('/closeRequest', async (req, res) => {
  const { supportRequestId } = req.body;

  if (!supportRequestId) {
    res.status(400).send("Property 'supportRequestId' is required");
    return;
  }

  try {
    const result = await SupportRequest.createQueryBuilder('supportRequest')
      .update()
      .set({
        status: SupportRequestStatus.Complete,
      })
      .where({
        id: supportRequestId,
      })
      .execute();

    if (result.affected > 0) {
      res.sendStatus(200);
    } else {
      res.status(404).send('Support Request not found');
    }
  } catch (err) {
    res.status(500).send('Unable to close request');
    logger.error(err);
  }
});
