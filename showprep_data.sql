--
-- PostgreSQL database dump
--

\restrict gLTmagASpJtcrUmwZdbyxGF8vH6EKN4MyI45Ef3fkzd9JAwsRe6EclHOgnMdSW9

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
-- Data for Name: Case; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Case" (id, department, "caseType", "lengthIn", "widthIn", "heightIn", "weightLbs", "defaultContents", notes, "photoUrl", "currentStatus", "currentLocation", "ownerLabel") FROM stdin;
\.


--
-- Data for Name: CrewMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CrewMember" (id, name) FROM stdin;
\.


--
-- Data for Name: Show; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Show" (id, name, dates, venue, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Issue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Issue" (id, "showId", "caseId", type, notes, "photoUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: ShowCase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShowCase" (id, "showId", "caseId", "ownerId", "ownerRole", "truckLabel", "zoneLabel", "overrideNotes", "loadOrder") FROM stdin;
\.


--
-- Data for Name: TruckProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TruckProfile" (id, name, "lengthIn", "widthIn", "heightIn", notes) FROM stdin;
\.


--
-- Data for Name: ShowTruck; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShowTruck" (id, "showId", "truckId", "loadRank") FROM stdin;
\.


--
-- Data for Name: StatusEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StatusEvent" (id, "caseId", "showId", status, location, "truckLabel", "zoneLabel", note, "scannedAt") FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict gLTmagASpJtcrUmwZdbyxGF8vH6EKN4MyI45Ef3fkzd9JAwsRe6EclHOgnMdSW9

