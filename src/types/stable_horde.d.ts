/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface GenerationInput {
  /** The prompt which will be sent to Stable Diffusion to generate an image */
  prompt?: string;
  params?: ModelGenerationInputStable;

  /** Set to true if this request is NSFW. This will skip workers which censor images. */
  nsfw?: boolean;

  /** If the request is SFW, and the worker accidentaly generates NSFW, it will send back a censored image. */
  censor_nsfw?: boolean;
  workers?: string[];
}

export type ModelGenerationInputStable = ModelPayloadRootStable & {
  steps?: number;
  n?: number;
};

export interface ModelPayloadRootStable {
  /** @example k_lms */
  sampler_name?:
    | "k_lms"
    | "k_heun"
    | "k_euler"
    | "k_euler_a"
    | "k_dpm_2"
    | "k_dpm_2_a"
    | "DDIM"
    | "PLMS";

  /**
   * Special Toggles used in the SD Webui. To be documented.
   * @example [1,4]
   */
  toggles?: number[];
  realesrgan_model_name?: string;
  ddim_eta?: number;

  /** @example 1 */
  batch_size?: number;

  /** @example 5 */
  cfg_scale?: number;

  /** The seed to use to generete this request */
  seed?: string;

  /**
   * The height of the image to generate
   * @example 512
   */
  height?: number;

  /**
   * The width of the image to generate
   * @example 512
   */
  width?: number;

  /**
   * Whether to only accept trusted workers
   * @example true
   */
  trusted: boolean;

  /** @example 512 */
  fp?: number;
  variant_amount?: number;
  variant_seed?: number;
}

export interface RequestError {
  /** The error message for this status code. */
  message?: string;
}

export type RequestStatusStable = RequestStatusCheck & {
  generations?: GenerationStable[];
};

export interface RequestStatusCheck {
  /** The amount of finished images in this request */
  finished: number;

  /** The amount of still processing images in this request */
  processing: number;

  /** The amount of images waiting to be picked up by a worker */
  waiting: number;

  /** True when all images in this request are done. Else False. */
  done: boolean;

  /** The expected amount to wait (in seconds) to generate all images in this request */
  wait_time: number;

  /** The position in the requests queue. This position is determined by relative Kudos amounts. */
  queue_position: number;
}

export type GenerationStable = Generation & { img?: string; seed?: string };

export interface Generation {
  /**
   * Worker ID
   * The UUID of the worker which generated this image
   */
  worker_id?: string;

  /**
   * Worker Name
   * The name of the worker which generated this image
   */
  worker_name?: string;
}

export interface RequestAsync {
  /** The UUID of the request. Use this to retrieve the request status in the future */
  id?: string;

  /** Any extra information from the horde about this request */
  message?: string;
}

export interface GenerationPayload {
  payload?: ModelPayloadStable;

  /** The UUID for this image generation */
  id?: string;
  skipped?: NoValidRequestFoundStable;
}

export type ModelPayloadStable = ModelPayloadRootStable & {
  prompt?: string;
  ddim_steps?: number;
  n_iter?: number;
};

export type NoValidRequestFoundStable = NoValidRequestFound & {
  max_pixels?: number;
};

export interface NoValidRequestFound {
  /** How many waiting requests were skipped because they demanded a specific worker */
  worker_id?: number;

  /** How many waiting requests were skipped because they demanded a nsfw generation which this worker does not provide. */
  nsfw?: number;
}

export interface GenerationSubmitted {
  /**
   * The amount of kudos gained for submitting this request
   * @example 10
   */
  reward?: number;
}

export interface UserDetails {
  /** The user's unique Username. It is a combination of their chosen alias plus their ID. */
  username?: string;

  /** The user unique ID. It is always an integer. */
  id?: number;

  /** The amount of Kudos this user has. Can be negative. The amount of Kudos determines the priority when requesting image generations. */
  kudos?: number;
  kudos_details?: UserKudosDetails;
  usage?: UsageDetailsStable;
  contributions?: ContributionsDetailsStable;

  /** How many concurrent image generations this user may request. */
  concurrency?: number;
}

export interface UserKudosDetails {
  /** The ammount of Kudos accumulated or used for generating images. */
  accumulated?: number;

  /** The amount of Kudos this user has given to other users */
  gifted?: number;

  /** The amount of Kudos this user has been given by the Horde admins */
  admin?: number;

  /** The amount of Kudos this user has been given by other users */
  received?: number;
}

export type UsageDetailsStable = UsageDetails & { megapixelsteps?: number };

export interface UsageDetails {
  /** How many images this user has requested */
  requests?: number;
}

export type ContributionsDetailsStable = ContributionsDetails & {
  megapixelsteps?: number;
};

export interface ContributionsDetails {
  /** How many images this user has generated */
  fulfillments?: number;
}

export interface ModifyUser {
  /** The new total Kudos this user has after this request */
  new_kudos?: number;

  /**
   * The request concurrency this user has after this request
   * @example 30
   */
  concurrency?: number;

  /**
   * Multiplies the amount of kudos lost when generating images.
   * @example 1
   */
  usage_multiplier?: number;
}

export type WorkerDetailsStable = WorkerDetails & {
  max_pixels?: number;
  megapixelsteps_generated?: number;
};

export interface WorkerDetails {
  /** The Name given to this worker. */
  name?: string;

  /** The UUID of this worker. */
  id?: string;

  /** How many images this worker has generated. */
  requests_fulfilled?: number;

  /** How many Kudos this worker has been rewarded in total. */
  kudos_rewards?: number;
  kudos_details?: WorkerKudosDetails;

  /** The average performance of this worker in human readable form. */
  performance?: string;

  /** The amount of seconds this worker has been online for this Horde. */
  uptime?: number;

  /**
   * When True, this worker will not pick up any new requests
   * @example false
   */
  maintenance_mode?: boolean;

  /**
   * When True, this worker not be given any new requests.
   * @example false
   */
  paused?: boolean;

  /**
   * Extra information or comments about this worker provided by its owner.
   * @example https://dbzer0.com
   */
  info?: string;

  /**
   * Whether this server can generate NSFW requests or not.
   * @example https://dbzer0.com
   */
  nsfw?: boolean;
}

export interface WorkerKudosDetails {
  /** How much Kudos this worker has received for generating images */
  generated?: number;

  /** How much Kudos this worker has received for staying online longer */
  uptime?: number;
}

export interface ModifyWorker {
  /** The new state of the 'maintenance' var for this worker. When True, this worker will not pick up any new requests. */
  maintenance?: boolean;

  /** The new state of the 'paused' var for this worker. When True, this worker will not be given any new requests. */
  paused?: boolean;

  /** The new state of the 'info' var for this worker. */
  info?: string;
}

export interface KudosTransferred {
  /**
   * The amount of Kudos tranferred
   * @example 100
   */
  transferred?: number;
}

export type HordePerformanceStable = HordePerformance & {
  queued_requests?: number;
  queued_megapixelsteps?: number;
  past_minute_megapixelsteps?: number;
  worker_count?: number;
};

export interface HordePerformance {
  /** The amount of waiting and processing requests currently in this Horde */
  queued_requests?: number;

  /** How many workers are actively processing image generations in this Horde in the past 5 minutes */
  worker_count?: number;
}

export interface HordeMaintenanceMode {
  /** When True, this Horde will not accept new requests for image generation, but will finish processing the ones currently in the queue. */
  maintenance_mode?: boolean;
}

export interface MaintenanceModeSet {
  /**
   * The current state of maintenance_mode
   * @example true
   */
  maintenance_mode?: boolean;
}

export interface GenerationStableV1 {
  img?: string;
  seed?: string;
  server_id?: string;
  server_name?: string;

  /** The position in the requests queue. This position is determined by relative Kudos amounts. */
  queue_position?: number;
}

export type RequestStatusStableV1 = RequestStatusCheckStableV1 & {
  generations?: GenerationStableV1[];
};

export interface RequestStatusCheckStableV1 {
  finished?: number;
  processing?: number;
  waiting?: number;
  done?: boolean;
  wait_time?: number;

  /** The position in the requests queue. This position is determined by relative Kudos amounts. */
  queue_position?: number;
}

