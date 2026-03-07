--
-- PostgreSQL database dump
--

\restrict B8DZ8BGFRS8unXNk7R7TNcaG5pfeRUVbJ3ZxpsrYvZfPbBqHkmLH38JPuSLUiED

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Case; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Case" (
    id text NOT NULL,
    department text NOT NULL,
    "caseType" text NOT NULL,
    "lengthIn" double precision,
    "widthIn" double precision,
    "heightIn" double precision,
    "weightLbs" double precision,
    "defaultContents" text NOT NULL,
    notes text,
    "photoUrl" text,
    "currentStatus" text DEFAULT 'IN_SHOP'::text NOT NULL,
    "currentLocation" text DEFAULT 'Shop'::text NOT NULL,
    "ownerLabel" text
);


--
-- Name: CrewMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CrewMember" (
    id text NOT NULL,
    name text NOT NULL
);


--
-- Name: Issue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Issue" (
    id text NOT NULL,
    "showId" text NOT NULL,
    "caseId" text NOT NULL,
    type text NOT NULL,
    notes text,
    "photoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Show; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Show" (
    id text NOT NULL,
    name text NOT NULL,
    dates text NOT NULL,
    venue text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ShowCase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShowCase" (
    id text NOT NULL,
    "showId" text NOT NULL,
    "caseId" text NOT NULL,
    "ownerId" text,
    "ownerRole" text,
    "truckLabel" text,
    "zoneLabel" text,
    "overrideNotes" text,
    "loadOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: ShowTruck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShowTruck" (
    id text NOT NULL,
    "showId" text NOT NULL,
    "truckId" text NOT NULL,
    "loadRank" integer DEFAULT 0 NOT NULL
);


--
-- Name: StatusEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StatusEvent" (
    id text NOT NULL,
    "caseId" text NOT NULL,
    "showId" text,
    status text NOT NULL,
    location text,
    "truckLabel" text,
    "zoneLabel" text,
    note text,
    "scannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TruckProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TruckProfile" (
    id text NOT NULL,
    name text NOT NULL,
    "lengthIn" double precision,
    "widthIn" double precision,
    "heightIn" double precision,
    notes text
);


--
-- Name: Case Case_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_pkey" PRIMARY KEY (id);


--
-- Name: CrewMember CrewMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CrewMember"
    ADD CONSTRAINT "CrewMember_pkey" PRIMARY KEY (id);


--
-- Name: Issue Issue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_pkey" PRIMARY KEY (id);


--
-- Name: ShowCase ShowCase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowCase"
    ADD CONSTRAINT "ShowCase_pkey" PRIMARY KEY (id);


--
-- Name: ShowTruck ShowTruck_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowTruck"
    ADD CONSTRAINT "ShowTruck_pkey" PRIMARY KEY (id);


--
-- Name: Show Show_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Show"
    ADD CONSTRAINT "Show_pkey" PRIMARY KEY (id);


--
-- Name: StatusEvent StatusEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StatusEvent"
    ADD CONSTRAINT "StatusEvent_pkey" PRIMARY KEY (id);


--
-- Name: TruckProfile TruckProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TruckProfile"
    ADD CONSTRAINT "TruckProfile_pkey" PRIMARY KEY (id);


--
-- Name: ShowCase_showId_caseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShowCase_showId_caseId_key" ON public."ShowCase" USING btree ("showId", "caseId");


--
-- Name: ShowTruck_showId_truckId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShowTruck_showId_truckId_key" ON public."ShowTruck" USING btree ("showId", "truckId");


--
-- Name: TruckProfile_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TruckProfile_name_key" ON public."TruckProfile" USING btree (name);


--
-- Name: Issue Issue_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Issue Issue_showId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_showId_fkey" FOREIGN KEY ("showId") REFERENCES public."Show"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShowCase ShowCase_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowCase"
    ADD CONSTRAINT "ShowCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ShowCase ShowCase_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowCase"
    ADD CONSTRAINT "ShowCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."CrewMember"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ShowCase ShowCase_showId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowCase"
    ADD CONSTRAINT "ShowCase_showId_fkey" FOREIGN KEY ("showId") REFERENCES public."Show"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShowTruck ShowTruck_showId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowTruck"
    ADD CONSTRAINT "ShowTruck_showId_fkey" FOREIGN KEY ("showId") REFERENCES public."Show"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShowTruck ShowTruck_truckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShowTruck"
    ADD CONSTRAINT "ShowTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES public."TruckProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StatusEvent StatusEvent_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StatusEvent"
    ADD CONSTRAINT "StatusEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StatusEvent StatusEvent_showId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StatusEvent"
    ADD CONSTRAINT "StatusEvent_showId_fkey" FOREIGN KEY ("showId") REFERENCES public."Show"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict B8DZ8BGFRS8unXNk7R7TNcaG5pfeRUVbJ3ZxpsrYvZfPbBqHkmLH38JPuSLUiED

