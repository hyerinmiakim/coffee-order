/* eslint-disable jsx-a11y/label-has-associated-control */
import { NextPage, GetServerSideProps } from 'next';
import Router from 'next/router';
import { ReactNode, useMemo, useState } from 'react';

import Layout from '@/components/Layout';
import { IEvent } from '@/models/interface/IEvent';
import EventClientModel from '@/models/event.client.model';
import FirebaseAuthClient from '@/models/commons/firebase_auth_client.model';
import { getFormatDate, gethhmmss, getYYYYMMDD } from '@/utils/time_helper';
import useDialog from '@/hooks/use_dialog';

interface Props {
  events: IEvent[] | null;
}

const EventsPage: NextPage<Props> = ({events: propsEvents}) => {
  const { showToast } = useDialog();
  const [events, updateEvent] = useState<IEvent[] | null>(propsEvents);
  
  return (
    <Layout>
      <div className="mx-auto max-w-xl px-6 py-12 bg-white border-0 shadow-lg sm:rounded-3xl">
        <h1 className="text-2xl font-bold mb-8">진행중인 이벤트</h1>
        <div className="relative z-0 w-full mb-5">
        <ul className="relative z-0 w-full mb-1">
          {events?.map(item => {
            return <li> <button className="bg-gray" onClick={async () => {
              const targerPage = `/events/${item.id}`;
              Router.push(targerPage);
            }}>{item.title}</button> </li>
          })}
        </ul>
          
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const events = await EventClientModel.findAllEvent({host: process.env.DOMAIN_HOST});
    console.log("getServerSideProp", events.payload?.length);
    return {
      props: {
        events: events.payload
      }
    }
  } catch (err) {
    return {
      props: {
        events: null
      }
    }
  } 
}

export default EventsPage;
