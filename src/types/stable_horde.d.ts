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
  prompt: string;
  params?: ModelGenerationInputStable;
  /** Set to true if this request is NSFW. This will skip workers which censor images. */
  nsfw?: boolean;
  /** When true, only trusted workers will serve this request. When False, Evaluating workers will also be used which can increase speed but adds more risk! */
  trusted_workers?: boolean;
  /** If the request is SFW, and the worker accidentaly generates NSFW, it will send back a censored image. */
  censor_nsfw?: boolean;
  workers?: string[];
  models?: string[];
  /** The Base64-encoded webp to use for img2img */
  source_image?: string;
  /**
   * If source_image is provided, specifies how to process it.
   * @example img2img
   */
  source_processing?: "img2img" | "inpainting" | "outpainting";
  /** If source_processing is set to 'inpainting' or 'outpainting', this parameter can be optionally provided as the  Base64-encoded webp mask of the areas to inpaint. If this arg is not passed, the inpainting/outpainting mask has to be embedded as alpha channel */
  source_mask?: string;
}

export type ModelGenerationInputStable = ModelPayloadRootStable & {
  /**
   * @min 1
   * @max 500
   * @example 50
   */
  steps?: number;
  /**
   * The amount of images to generate
   * @min 1
   * @max 20
   * @example 1
   */
  n?: number;
};

export interface ModelPayloadRootStable {
  /** @example k_lms */
  sampler_name?: "k_lms" | "k_heun" | "k_euler" | "k_euler_a" | "k_dpm_2" | "k_dpm_2_a";
  /**
   * Obsolete Toggles used in the SD Webui. To be removed. Do not modify unless you know what you're doing.
   * @example [1,4]
   */
  toggles?: number[];
  /**
   * @min -40
   * @max 30
   */
  cfg_scale?: number;
  /**
   * @min 0
   * @max 1
   * @example 0.75
   */
  denoising_strength?: number;
  /** The seed to use to generete this request */
  seed?: string;
  /**
   * The height of the image to generate
   * @min 64
   * @max 3072
   */
  height?: number;
  /**
   * The width of the image to generate
   * @min 64
   * @max 3072
   */
  width?: number;
  /**
   * If passed with multiple n, the provided seed will be incremented every time by this value
   * @min 1
   * @max 1000
   * @example 1
   */
  seed_variation?: number;
  /** Set to true to process the generated image with GFPGAN (face correction) */
  use_gfpgan?: boolean;
  /** Set to true to process the generated image with RealESRGAN */
  use_real_esrgan?: boolean;
  /** Set to true to process the generated image with LDSR */
  use_ldsr?: boolean;
  /** Set to true to upscale the image */
  use_upscaling?: boolean;
}

export interface RequestError {
  /** The error message for this status code. */
  message?: string;
}

export type RequestStatusStable = RequestStatusCheck & {
  generations?: GenerationStable[];
};

export interface RequestStatusCheck {
  /** The amount of finished jobs in this request */
  finished?: number;
  /** The amount of still processing jobs in this request */
  processing?: number;
  /** The amount of jobs that timed out and had to be restarted or were reported as failed by a worker */
  restarted?: number;
  /** The amount of jobs waiting to be picked up by a worker */
  waiting?: number;
  /** True when all jobs in this request are done. Else False. */
  done?: boolean;
  /** True when this request caused an internal server error and could not be completed. */
  faulted?: boolean;
  /** The expected amount to wait (in seconds) to generate all jobs in this request */
  wait_time?: number;
  /** The position in the requests queue. This position is determined by relative Kudos amounts. */
  queue_position?: number;
  /** The amount of total Kudos this request has consumed until now. */
  kudos?: number;
  /** If False, this request will not be able to be completed with the pool of workers currently available */
  is_possible?: boolean;
}

export type GenerationStable = Generation & {
  /**
   * Generated Image
   * The generated image as a Base64-encoded .webp file
   */
  img?: string;
  /**
   * Generation Seed
   * The seed which generated this image
   */
  seed?: string;
};

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
  /**
   * Generation Model
   * The model which generated this image
   */
  model?: string;
}

export interface RequestAsync {
  /** The UUID of the request. Use this to retrieve the request status in the future */
  id?: string;
  /** Any extra information from the horde about this request */
  message?: string;
}

export type PopInputStable = PopInput & {
  /** The maximum amount of pixels this worker can generate */
  max_pixels?: number;
  /** If True, this worker will pick up img2img requests */
  allow_img2img?: boolean;
  /** If True, this worker will pick up inpainting/outpainting requests */
  allow_painting?: boolean;
  /** If True, this worker will pick up img2img requests coming from clients with an unsafe IP. */
  allow_unsafe_ipaddr?: boolean;
};

export interface PopInput {
  /** The Name of the Worker */
  name?: string;
  priority_usernames?: string[];
  /** Whether this worker can generate NSFW requests or not. */
  nsfw?: boolean;
  blacklist?: string[];
  models?: string[];
  /** The version of the bridge used by this worker */
  bridge_version?: number;
}

export interface GenerationPayload {
  payload?: ModelPayloadStable;
  /** The UUID for this image generation */
  id?: string;
  skipped?: NoValidRequestFoundStable;
  /** Which of the available models to use for this request */
  model?: string;
  /** The Base64-encoded webp to use for img2img */
  source_image?: string;
  /**
   * If source_image is provided, specifies how to process it.
   * @example img2img
   */
  source_processing?: "img2img" | "inpainting" | "outpainting";
  /** If img_processing is set to 'inpainting' or 'outpainting', this parameter can be optionally provided as the mask of the areas to inpaint. If this arg is not passed, the inpainting/outpainting mask has to be embedded as alpha channel */
  source_mask?: string;
}

export type ModelPayloadStable = ModelPayloadRootStable & {
  /** The prompt which will be sent to Stable Diffusion to generate an image */
  prompt?: string;
  ddim_steps?: number;
  /** The amount of images to generate */
  n_iter?: number;
  /** When true will apply NSFW censoring model on the generation */
  use_nsfw_censor?: boolean;
};

export type NoValidRequestFoundStable = NoValidRequestFound & {
  /** How many waiting requests were skipped because they demanded a higher size than this worker provides */
  max_pixels?: number;
  /** How many waiting requests were skipped because they came from an unsafe IP */
  unsafe_ip?: number;
  /** How many waiting requests were skipped because they requested img2img */
  img2img?: number;
  /** How many waiting requests were skipped because they requested inpainting/outpainting */
  painting?: number;
};

export interface NoValidRequestFound {
  /** How many waiting requests were skipped because they demanded a specific worker */
  worker_id?: number;
  /** How many waiting requests were skipped because they demanded a specific worker */
  performance?: number;
  /** How many waiting requests were skipped because they demanded a nsfw generation which this worker does not provide. */
  nsfw?: number;
  /** How many waiting requests were skipped because they demanded a generation with a word that this worker does not accept. */
  blacklist?: number;
  /** How many waiting requests were skipped because they demanded a trusted worker which this worker is not. */
  untrusted?: number;
  /**
   * How many waiting requests were skipped because they demanded a different model than what this worker provides.
   * @example 0
   */
  models?: number;
}

export interface GenerationSubmitted {
  /**
   * The amount of kudos gained for submitting this request
   * @example 10
   */
  reward?: number;
}

export type UserDetailsStable = UserDetails & {
  kudos_details?: UserKudosDetails;
  usage?: UsageDetailsStable;
  contributions?: ContributionsDetailsStable;
};

export interface UserDetails {
  /** The user's unique Username. It is a combination of their chosen alias plus their ID. */
  username?: string;
  /** The user unique ID. It is always an integer. */
  id?: number;
  /** The amount of Kudos this user has. The amount of Kudos determines the priority when requesting image generations. */
  kudos?: number;
  /** (Privileged) The amount of Evaluating Kudos this untrusted user has from generations and uptime. When this number reaches a prespecified threshold, they automatically become trusted. */
  evaluating_kudos?: number;
  /** How many concurrent generations this user may request. */
  concurrency?: number;
  /** Whether this user has been invited to join a worker to the horde and how many of them. When 0, this user cannot add (new) workers to the horde. */
  worker_invited?: number;
  /**
   * This user is a Horde moderator.
   * @example false
   */
  moderator?: boolean;
  kudos_details?: UserKudosDetails;
  /** How many workers this user has created (active or inactive) */
  worker_count?: number;
  worker_ids?: string[];
  monthly_kudos?: MonthlyKudos;
  /**
   * This user is a trusted member of the Horde.
   * @example false
   */
  trusted?: boolean;
  /**
   * (Privileged) How much suspicion this user has accumulated
   * @example 0
   */
  suspicious?: number;
  /**
   * If true, this user has not registered using an oauth service.
   * @example false
   */
  pseudonymous?: boolean;
  /**
   * (Privileged) Contact details for the horde admins to reach the user in case of emergency.
   * @example email@example.com
   */
  contact?: string;
}

export interface UserKudosDetails {
  /** The ammount of Kudos accumulated or used for generating images. */
  accumulated?: number;
  /** The amount of Kudos this user has given to other users. */
  gifted?: number;
  /** The amount of Kudos this user has been given by the Horde admins. */
  admin?: number;
  /** The amount of Kudos this user has been given by other users. */
  received?: number;
  /** The amount of Kudos this user has received from recurring rewards. */
  recurring?: number;
}

export interface MonthlyKudos {
  /** How much recurring Kudos this user receives monthly. */
  amount?: number;
  /**
   * Last date this user received monthly Kudos.
   * @format date-time
   */
  last_received?: string;
}

export type UsageDetailsStable = UsageDetails & {
  /** How many megapixelsteps this user has requested */
  megapixelsteps?: number;
};

export interface UsageDetails {
  /** How many images this user has requested */
  requests?: number;
}

export type ContributionsDetailsStable = ContributionsDetails & {
  /** How many megapixelsteps this user has generated */
  megapixelsteps?: number;
};

export interface ContributionsDetails {
  /** How many images this user has generated */
  fulfillments?: number;
}

export interface ModifyUserInput {
  /** The amount of kudos to modify (can be negative) */
  kudos?: number;
  /**
   * The amount of concurrent request this user can have
   * @min 0
   * @max 100
   */
  concurrency?: number;
  /**
   * The amount by which to multiply the users kudos consumption
   * @min 0.1
   * @max 10
   */
  usage_multiplier?: number;
  /** Set to the amount of workers this user is allowed to join to the horde when in worker invite-only mode. */
  worker_invited?: number;
  /**
   * Set to true to Make this user a horde moderator
   * @example false
   */
  moderator?: boolean;
  /**
   * Set to true to Make this user a display their worker IDs
   * @example false
   */
  public_workers?: boolean;
  /**
   * When specified, will start assigning the user monthly kudos, starting now!
   * @min 0
   */
  monthly_kudos?: number;
  /** When specified, will change the username. No profanity allowed! */
  username?: string;
  /**
   * When set to true,the user and their servers will not be affected by suspicion
   * @example false
   */
  trusted?: boolean;
  /** Set the user's suspicion back to 0 */
  reset_suspicion?: boolean;
  /**
   * Contact details for the horde admins to reach the user in case of emergency. This is only visible to horde moderators.
   * @example email@example.com
   */
  contact?: string;
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
  /**
   * Whether this user has been invited to join a worker to the horde and how many of them. When 0, this user cannot add (new) workers to the horde.
   * @example 1
   */
  worker_invited?: number;
  /**
   * The user's new moderator status.
   * @example false
   */
  moderator?: boolean;
  /**
   * The user's new public_workers status.
   * @example false
   */
  public_workers?: boolean;
  /**
   * The user's new username.
   * @example username#1
   */
  username?: string;
  /**
   * The user's new monthly kudos total
   * @example 0
   */
  monthly_kudos?: number;
  /** The user's new trusted status */
  trusted?: boolean;
  /** The user's new suspiciousness rating */
  new_suspicion?: number;
  /**
   * The new contact details
   * @example email@example.com
   */
  contact?: string;
}

// Custom type
type CustomWorkerDetails = WorkerDetailsStable & {stale: boolean};

export type WorkerDetailsStable = WorkerDetails & {
  /**
   * The maximum pixels in resolution this worker can generate
   * @example 262144
   */
  max_pixels?: number;
  /** How many megapixelsteps this worker has generated until now */
  megapixelsteps_generated?: number;
  /** If True, this worker supports and allows img2img requests. */
  img2img?: boolean;
  /** If True, this worker supports and allows inpainting requests. */
  painting?: boolean;
};

export type WorkerDetails = WorkerDetailsLite & {
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
   * (Privileged) When True, this worker not be given any new requests.
   * @example false
   */
  paused?: boolean;
  /**
   * Extra information or comments about this worker provided by its owner.
   * @example https://dbzer0.com
   */
  info?: string;
  /** Whether this worker can generate NSFW requests or not. */
  nsfw?: boolean;
  /**
   * Privileged or public if the owner has allowed it. The alias of the owner of this worker.
   * @example username#1
   */
  owner?: string;
  /** The worker is trusted to return valid generations. */
  trusted?: boolean;
  /**
   * (Privileged) How much suspicion this worker has accumulated
   * @example 0
   */
  suspicious?: number;
  /**
   * How many jobs this worker has left uncompleted after it started them.
   * @example 0
   */
  uncompleted_jobs?: number;
  models?: string[];
  /**
   * The team towards which this worker contributes kudos.
   * @example Direct Action
   */
  team?: TeamDetailsLite;
  /**
   * (Privileged) Contact details for the horde admins to reach the owner of this worker in emergencies.
   * @example email@example.com
   */
  contact?: string;
};

export interface TeamDetailsLite {
    /** The Name given to this team. */
    name?: string;
    /** The team ID towards which this worker contributes kudos. It an empty string ('') is passed, it will leave the worker without a team. */
    id?: string;
}  

export interface WorkerDetailsLite {
  /** The Name given to this worker. */
  name?: string;
  /** The UUID of this worker. */
  id?: string;
}

export interface WorkerKudosDetails {
  /** How much Kudos this worker has received for generating images */
  generated?: number;
  /** How much Kudos this worker has received for staying online longer */
  uptime?: number;
}

export interface ModifyWorkerInput {
  /** (Mods only) Set to true to put this worker into maintenance. */
  maintenance?: boolean;
  /** (Mods only) Set to true to pause this worker. */
  paused?: boolean;
  /** You can optionally provide a server note which will be seen in the server details. No profanity allowed! */
  info?: string;
  /** When this is set, it will change the worker's name. No profanity allowed! */
  name?: string;
  /**
   * The team towards which this worker contributes kudos. No profanity allowed!
   * @example 0bed257b-e57c-4327-ac64-40cdfb1ac5e6
   */
  team?: string;
}

export interface ModifyWorker {
  /** The new state of the 'maintenance' var for this worker. When True, this worker will not pick up any new requests. */
  maintenance?: boolean;
  /** The new state of the 'paused' var for this worker. When True, this worker will not be given any new requests. */
  paused?: boolean;
  /** The new state of the 'info' var for this worker. */
  info?: string;
  /** The new name for this this worker. */
  name?: string;
  /**
   * The new team of this worker.
   * @example Direct Action
   */
  team?: string;
}

export interface DeletedWorker {
  /** The ID of the deleted worker */
  deleted_id?: string;
  /** The Name of the deleted worker */
  deleted_name?: string;
}

export interface KudosTransferred {
  /**
   * The amount of Kudos tranferred
   * @example 100
   */
  transferred?: number;
}

export interface HordeModes {
  /** When True, this Horde will not accept new requests for image generation, but will finish processing the ones currently in the queue. */
  maintenance_mode?: boolean;
  /** When True, this Horde will not only accept worker explicitly invited to join. */
  invite_only_mode?: boolean;
  /** When True, this Horde will not always provide full information in order to throw off attackers. */
  raid_mode?: boolean;
}

export type HordePerformanceStable = HordePerformance & {
  /** The amount of waiting and processing requests currently in this Horde */
  queued_requests?: number;
  /** The amount of megapixelsteps in waiting and processing requests currently in this Horde */
  queued_megapixelsteps?: number;
  /** How many megapixelsteps this Horde generated in the last minute */
  past_minute_megapixelsteps?: number;
  /** How many workers are actively processing image generations in this Horde in the past 5 minutes */
  worker_count?: number;
};

export interface HordePerformance {
  /** The amount of waiting and processing requests currently in this Horde */
  queued_requests?: number;
  /** How many workers are actively processing image generations in this Horde in the past 5 minutes */
  worker_count?: number;
}

export type ActiveModel = ActiveModelLite & {
  /** The average speed of generation for this model */
  performance?: number;
  /** The amount waiting to be generated by this model */
  queued?: number;
  /** Estimated time in seconds for this model's queue to be cleared */
  eta?: number;
};

export interface ActiveModelLite {
  /** The Name of a model available by workers in this horde. */
  name?: string;
  /** How many of workers in this horde are running this model. */
  count?: number;
}

export interface Newspiece {
  /** The date this newspiece was published */
  date_published?: string;
  /** The actual piece of news */
  newspiece?: string;
  /**
   * How critical this piece of news is.
   * @example Information
   */
  importance?: string;
}

export interface CreateTeamInput {
  /** The name of the team. No profanity allowed! */
  name: string;
  /**
   * Extra information or comments about this team.
   * @example Anarchy is emergent order.
   */
  info?: string;
}

export interface ModifyTeam {
  /** The ID of the team */
  id?: string;
  /** The Name of the team */
  name?: string;
  /** The Info of the team */
  info?: string;
}

export type TeamDetailsStable = TeamDetails & {
  /** How many megapixelsteps the workers in this team have been rewarded while part of this team. */
  contributions?: number;
  /** The average performance of the workers in this team, in megapixelsteps per second. */
  performance?: number;
  /** The total expected speed of this team when all workers are working in parallel, in megapixelsteps per second. */
  speed?: number;
};

export interface TeamDetails {
  /** The Name given to this team. */
  name?: string;
  /**
   * Extra information or comments about this team provided by its owner.
   * @example Anarchy is emergent order.
   */
  info?: string;
  /** The UUID of this team. */
  id?: string;
  /** How many images this team's workers have generated. */
  requests_fulfilled?: number;
  /** How many Kudos the workers in this team have been rewarded while part of this team. */
  kudos?: number;
  /** The total amount of time workers have stayed online while on this team */
  uptime?: number;
  /**
   * The alias of the user which created this team.
   * @example db0#1
   */
  creater?: string;
  /**
   * How many workers have been dedicated to this team
   * @example 10
   */
  worker_count?: number;
  workers?: WorkerDetailsLite[];
  models?: ActiveModelLite[];
}

export interface ModifyTeamInput {
  /** The name of the team. No profanity allowed! */
  name?: string;
  /**
   * Extra information or comments about this team.
   * @example Anarchy is emergent order.
   */
  info?: string;
}

export interface DeletedTeam {
  /** The ID of the deleted team */
  deleted_id?: string;
  /** The Name of the deleted team */
  deleted_name?: string;
}
