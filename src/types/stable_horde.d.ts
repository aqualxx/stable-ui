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

export interface GenerationInputStable {
  /** The prompt which will be sent to Stable Diffusion to generate an image */
  prompt: string;
  params?: ModelGenerationInputStable;
  /** Set to true if this request is NSFW. This will skip workers which censor images. */
  nsfw?: boolean;
  /** When true, only trusted workers will serve this request. When False, Evaluating workers will also be used which can increase speed but adds more risk! */
  trusted_workers?: boolean;
  /** When True, allows slower workers to pick up this request. Disabling this incurs an extra kudos cost. */
  slow_workers?: boolean;
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
  /** If True, the image will be sent via cloudflare r2 download link */
  r2?: boolean;
  /** If True, The image will be shared with LAION for improving their dataset. This will also reduce your kudos consumption by 2. For anonymous users, this is always True. */
  shared?: boolean;
  /** If enabled, suspicious prompts are sanitized through a string replacement filter instead. */
  replacement_filter?: boolean;
}

export type ModelGenerationInputStable = ModelPayloadRootStable & {
  /**
   * @min 1
   * @max 500
   */
  steps?: number;
  /**
   * The amount of images to generate
   * @min 1
   * @max 20
   */
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
    | "k_dpm_fast"
    | "k_dpm_adaptive"
    | "k_dpmpp_2s_a"
    | "k_dpmpp_2m"
    | "dpmsolver"
    | "k_dpmpp_sde"
    | "DDIM";
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
  /** The seed to use to generate this request */
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
  post_processing?: (
    | "GFPGAN"
    | "RealESRGAN_x4plus"
    | "RealESRGAN_x4plus_anime_6B"
    | "NMKD_Siax"
    | "4x_AnimeSharp"
    | "CodeFormers"
    | "strip_background"
  )[];
  /** Set to True to enable karras noise scheduling tweaks */
  karras?: boolean;
  /** Set to True to create images that stitch together seamlessly */
  tiling?: boolean;
  /** Set to True to process the image at base resolution before upscaling and re-processing */
  hires_fix?: boolean;
  /**
   * The number of CLIP language processor layers to skip
   * @min 1
   * @max 12
   * @example 1
   */
  clip_skip?: number;
  /** @example canny */
  control_type?: "canny" | "hed" | "depth" | "normal" | "openpose" | "seg" | "scribble" | "fakescribbles" | "hough";
  /** Set to True if the image submitted is a pre-generated control map for ControlNet use */
  image_is_control?: boolean;
  /** Set to True if you want the ControlNet map returned instead of a generated image */
  return_control_map?: boolean;
  /**
   * @min 0
   * @max 1
   * @example 0.75
   */
  facefixer_strength?: number;
}

export interface RequestError {
  /** The error message for this status code. */
  message?: string;
}

export interface RequestAsync {
  /** The UUID of the request. Use this to retrieve the request status in the future */
  id?: string;
  /** Any extra information from the horde about this request */
  message?: string;
}

export type RequestStatusStable = RequestStatusCheck & {
  generations?: GenerationStable[];
  /** If True, These images have been shared with LAION. */
  shared?: boolean;
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
  /**
   * Generation ID
   * The ID for this image
   */
  id?: string;
  /** When true this image has been censored by the worker's safety filter. */
  censored?: boolean;
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
  /**
   * Generation State
   * The state of this generation.
   * @example ok
   */
  state: "ok" | "censored";
}

export interface AestheticsPayload {
  /**
   * The UUID of the best image in this generation batch (only used when 2+ images generated). If 2+ aesthetic ratings are also provided, then they take precedence if they're not tied.
   * @example 6038971e-f0b0-4fdd-a3bb-148f561f815e
   */
  best?: string;
  ratings?: AestheticRating[];
}

export interface AestheticRating {
  /**
   * The UUID of image being rated
   * @example 6038971e-f0b0-4fdd-a3bb-148f561f815e
   */
  id: string;
  /**
   * The aesthetic rating 1-10 for this image
   * @min 1
   * @max 10
   */
  rating: number;
  /**
   * The artifacts rating for this image.
   * 0 for flawless generation that perfectly fits to the prompt.
   * 1 for small, hardly recognizable flaws.
   * 2 small flaws that can easily be spotted, but don not harm the aesthetic experience.
   * 3 for flaws that look obviously wrong, but only mildly harm the aesthetic experience.
   * 4 for flaws that look obviously wrong & significantly harm the aesthetic experience.
   * 5 for flaws that make the image look like total garbage
   * @min 0
   * @max 5
   * @example 1
   */
  artifacts?: number;
}

export interface GenerationSubmitted {
  /**
   * The amount of kudos gained for submitting this request
   * @example 10
   */
  reward?: number;
}

export type PopInputStable = PopInput & {
  /** The maximum amount of pixels this worker can generate */
  max_pixels?: number;
  blacklist?: string[];
  /** If True, this worker will pick up img2img requests */
  allow_img2img?: boolean;
  /** If True, this worker will pick up inpainting/outpainting requests */
  allow_painting?: boolean;
  /** If True, this worker will pick up img2img requests coming from clients with an unsafe IP. */
  allow_unsafe_ipaddr?: boolean;
  /** If True, this worker will pick up requests requesting post-processing. */
  allow_post_processing?: boolean;
  /** If True, this worker will pick up requests requesting ControlNet. */
  allow_controlnet?: boolean;
};

export interface PopInput {
  /** The Name of the Worker */
  name?: string;
  priority_usernames?: string[];
  /** Whether this worker can generate NSFW requests or not. */
  nsfw?: boolean;
  models?: string[];
  /** The version of the bridge used by this worker */
  bridge_version?: number;
  /**
   * The worker name, version and website
   * @example AI Horde Worker:11:https://github.com/db0/AI-Horde-Worker
   */
  bridge_agent?: string;
  /**
   * How many threads this worker is running. This is used to accurately the current power available in the horde
   * @min 1
   * @max 10
   */
  threads?: number;
  /**
   * If True, this worker will only pick up requests where the owner has the required kudos to consume already available.
   * @example false
   */
  require_upfront_kudos?: boolean;
}

export interface GenerationPayloadStable {
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
  /** The r2 upload link to use to upload this image */
  r2_upload?: string;
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
  /** How many waiting requests were skipped because they requested post-processing */
  "post-processing"?: number;
  /** How many waiting requests were skipped because the user didn't have enough kudos when this worker requires upfront kudos */
  kudos?: number;
};

export interface NoValidRequestFound {
  /**
   * How many waiting requests were skipped because they demanded a specific worker
   * @min 0
   */
  worker_id?: number;
  /**
   * How many waiting requests were skipped because they required higher performance
   * @min 0
   */
  performance?: number;
  /**
   * How many waiting requests were skipped because they demanded a nsfw generation which this worker does not provide.
   * @min 0
   */
  nsfw?: number;
  /**
   * How many waiting requests were skipped because they demanded a generation with a word that this worker does not accept.
   * @min 0
   */
  blacklist?: number;
  /**
   * How many waiting requests were skipped because they demanded a trusted worker which this worker is not.
   * @min 0
   */
  untrusted?: number;
  /**
   * How many waiting requests were skipped because they demanded a different model than what this worker provides.
   * @min 0
   * @example 0
   */
  models?: number;
  /**
   * How many waiting requests were skipped because they require a higher version of the bridge than this worker is running (upgrade if you see this in your skipped list).
   * @min 0
   * @example 0
   */
  bridge_version?: number;
}

export type SubmitInputStable = SubmitInput & {
  /** The seed for this generation */
  seed: number;
  /** If True, this resulting image has been censored */
  censored?: boolean;
};

export interface SubmitInput {
  /**
   * The UUID of this generation
   * @example 00000000-0000-0000-0000-000000000000
   */
  id: string;
  /**
   * R2 result was uploaded to R2, else the string of the result.
   * @example R2
   */
  generation?: string;
  /**
   * Generation State
   * The state of this generation.
   * @example ok
   */
  state?: "ok" | "censored" | "faulted" | "csam";
}

export interface GenerationInputKobold {
  /** The prompt which will be sent to KoboldAI to generate text */
  prompt?: string;
  params?: ModelGenerationInputKobold;
  /** Specify which softpompt needs to be used to service this request */
  softprompt?: string;
  /** When true, only trusted workers will serve this request. When False, Evaluating workers will also be used which can increase speed but adds more risk! */
  trusted_workers?: boolean;
  /** When True, allows slower workers to pick up this request. Disabling this incurs an extra kudos cost. */
  slow_workers?: boolean;
  workers?: string[];
  models?: string[];
}

export type ModelGenerationInputKobold = ModelPayloadRootKobold & object;

export interface ModelPayloadRootKobold {
  /**
   * @min 1
   * @max 20
   * @example 1
   */
  n?: number;
  /**
   * Input formatting option. When enabled, adds a leading space to your input if there is no trailing whitespace at the end of the previous action.
   * @example false
   */
  frmtadsnsp?: boolean;
  /**
   * Output formatting option. When enabled, replaces all occurrences of two or more consecutive newlines in the output with one newline.
   * @example false
   */
  frmtrmblln?: boolean;
  /**
   * Output formatting option. When enabled, removes #/@%}{+=~|\^<> from the output.
   * @example false
   */
  frmtrmspch?: boolean;
  /**
   * Output formatting option. When enabled, removes some characters from the end of the output such that the output doesn't end in the middle of a sentence. If the output is less than one sentence long, does nothing.
   * @example false
   */
  frmttriminc?: boolean;
  /**
   * Maximum number of tokens to send to the model.
   * @min 80
   * @max 2048
   * @example 1024
   */
  max_context_length?: number;
  /**
   * Number of tokens to generate.
   * @min 16
   * @max 512
   */
  max_length?: number;
  /**
   * Base repetition penalty value.
   * @min 1
   */
  rep_pen?: number;
  /** Repetition penalty range. */
  rep_pen_range?: number;
  /** Repetition penalty slope. */
  rep_pen_slope?: number;
  /**
   * Output formatting option. When enabled, removes everything after the first line of the output, including the newline.
   * @example false
   */
  singleline?: boolean;
  /** Soft prompt to use when generating. If set to the empty string or any other string containing no non-whitespace characters, uses no soft prompt. */
  soft_prompt?: string;
  /**
   * Temperature value.
   * @min 0
   */
  temperature?: number;
  /** Tail free sampling value. */
  tfs?: number;
  /** Top-a sampling value. */
  top_a?: number;
  /** Top-k sampling value. */
  top_k?: number;
  /** Top-p sampling value. */
  top_p?: number;
  /** Typical sampling value. */
  typical?: number;
  sampler_order?: number[];
}

export type RequestStatusKobold = RequestStatusCheck & {
  generations?: GenerationKobold[];
};

export type GenerationKobold = Generation & {
  /**
   * Generated Text
   * The generated text.
   */
  text?: string;
  /**
   * Generation Seed
   * The seed which generated this text
   */
  seed?: number;
};

export type PopInputKobold = PopInput & {
  /** The maximum amount of tokens this worker can generate */
  max_length?: number;
  /** The max amount of context to submit to this AI for sampling. */
  max_context_length?: number;
  softprompts?: string[];
};

export interface GenerationPayload {
  payload?: ModelPayloadKobold;
  /** The UUID for this text generation */
  id?: string;
  skipped?: NoValidRequestFoundKobold;
  /** The soft prompt requested for this generation */
  softprompt?: string;
  /** Which of the available models to use for this request */
  model?: string;
}

export type ModelPayloadKobold = ModelPayloadRootKobold & {
  /** The prompt which will be sent to KoboldAI to generate the text */
  prompt?: string;
};

export type NoValidRequestFoundKobold = NoValidRequestFound & {
  /**
   * How many waiting requests were skipped because they demanded a higher max_context_length than what this worker provides.
   * @example 0
   */
  max_context_length?: number;
  /**
   * How many waiting requests were skipped because they demanded more generated tokens that what this worker can provide.
   * @example 0
   */
  max_length?: number;
  /**
   * How many waiting requests were skipped because they demanded an available soft-prompt which this worker does not have.
   * @example 0
   */
  matching_softprompt?: number;
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
   * This user has been flagged for suspicious activity.
   * @example false
   */
  flagged?: boolean;
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
  /**
   * How many seconds since this account was created
   * @example 60
   */
  account_age?: number;
  usage?: UsageDetails;
  contributions?: ContributionsDetails;
  records?: UserRecords;
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
  /** The amount of Kudos this user has been awarded from things like rating images. */
  awarded?: number;
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

export interface UsageDetails {
  /** How many megapixelsteps this user has requested */
  megapixelsteps?: number;
  /** How many images this user has requested */
  requests?: number;
}

export interface ContributionsDetails {
  /** How many megapixelsteps this user has generated */
  megapixelsteps?: number;
  /** How many images this user has generated */
  fulfillments?: number;
}

export interface UserRecords {
  usage?: UserThingRecords;
  contribution?: UserThingRecords;
  fulfillment?: UserAmountRecords;
  request?: UserAmountRecords;
}

export interface UserThingRecords {
  /** How many megapixelsteps this user has generated or requested */
  megapixelsteps?: number;
  /** How many token this user has generated or requested */
  tokens?: number;
}

export interface UserAmountRecords {
  /** How many images this user has generated or requested */
  image?: number;
  /** How many texts this user has generated or requested */
  text?: number;
  /** How many texts this user has generated or requested */
  interrogation?: number;
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
  /** When specified, will start assigning the user monthly kudos, starting now! */
  monthly_kudos?: number;
  /** When specified, will change the username. No profanity allowed! */
  username?: string;
  /**
   * When set to true,the user and their servers will not be affected by suspicion
   * @example false
   */
  trusted?: boolean;
  /**
   * When set to true, the user cannot tranfer kudos and all their workers are put into permanent maintenance.
   * @example false
   */
  flagged?: boolean;
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
  /** The user's new flagged status */
  flagged?: boolean;
  /** The user's new suspiciousness rating */
  new_suspicion?: number;
  /**
   * The new contact details
   * @example email@example.com
   */
  contact?: string;
}

export type WorkerDetails = WorkerDetailsLite & {
  /** How many images this worker has generated. */
  requests_fulfilled?: number;
  /** How many Kudos this worker has been rewarded in total. */
  kudos_rewards?: number;
  kudos_details?: WorkerKudosDetails;
  /** The average performance of this worker in human readable form. */
  performance?: string;
  /** How many threads this worker is running. */
  threads?: number;
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
  /** The worker's owner has been flagged for suspicious activity. This worker will not be given any jobs to process. */
  flagged?: boolean;
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
  team?: TeamDetailsLite;
  /**
   * (Privileged) Contact details for the horde admins to reach the owner of this worker in emergencies.
   * @example email@example.com
   */
  contact?: string;
  /**
   * The bridge agent name, version and website
   * @example AI Horde Worker:11:https://github.com/db0/AI-Horde-Worker
   */
  bridge_agent: string;
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
  /** If True, this worker supports and allows post-processing requests. */
  "post-processing"?: boolean;
  /**
   * The maximum tokens this worker can generate
   * @example 80
   */
  max_length?: number;
  /**
   * The maximum tokens this worker can read
   * @example 80
   */
  max_context_length?: number;
  /** How many tokens this worker has generated until now */
  tokens_generated?: number;
};

export interface WorkerDetailsLite {
  /**
   * The Type of worker this is.
   * @example image
   */
  type?: "image" | "text" | "interrogation";
  /** The Name given to this worker. */
  name?: string;
  /** The UUID of this worker. */
  id?: string;
  /** True if the worker has checked-in the past 5 minutes. */
  online?: boolean;
}

export interface WorkerKudosDetails {
  /** How much Kudos this worker has received for generating images */
  generated?: number;
  /** How much Kudos this worker has received for staying online longer */
  uptime?: number;
}

export interface TeamDetailsLite {
  /** The Name given to this team. */
  name?: string;
  /** The UUID of this team. */
  id?: string;
}

export interface ModifyWorkerInput {
  /** Set to true to put this worker into maintenance. */
  maintenance?: boolean;
  /** if maintenance is True, you can optionally provide a message to be used instead of the default maintenance message, so that the owner is informed. */
  maintenance_msg?: string;
  /** (Mods only) Set to true to pause this worker. */
  paused?: boolean;
  /** You can optionally provide a server note which will be seen in the server details. No profanity allowed! */
  info?: string;
  /** When this is set, it will change the worker's name. No profanity allowed! */
  name?: string;
  /**
   * The team towards which this worker contributes kudos.  It an empty string ('') is passed, it will leave the worker without a team. No profanity allowed!
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

export interface KudosAwarded {
  /**
   * The amount of Kudos awarded
   * @example 100
   */
  awarded?: number;
}

export interface HordeModes {
  /** When True, this Horde will not accept new requests for image generation, but will finish processing the ones currently in the queue. */
  maintenance_mode?: boolean;
  /** When True, this Horde will not only accept worker explicitly invited to join. */
  invite_only_mode?: boolean;
  /** When True, this Horde will not always provide full information in order to throw off attackers. */
  raid_mode?: boolean;
}

export interface HordePerformance {
  /** The amount of waiting and processing image requests currently in this Horde */
  queued_requests?: number;
  /** The amount of waiting and processing text requests currently in this Horde */
  queued_text_requests?: number;
  /** How many workers are actively processing prompt generations in this Horde in the past 5 minutes */
  worker_count?: number;
  /** How many workers are actively processing prompt generations in this Horde in the past 5 minutes */
  text_worker_count?: number;
  /** How many worker threads are actively processing prompt generations in this Horde in the past 5 minutes */
  thread_count?: number;
  /** How many worker threads are actively processing prompt generations in this Horde in the past 5 minutes */
  text_thread_count?: number;
  /** The amount of megapixelsteps in waiting and processing requests currently in this Horde */
  queued_megapixelsteps?: number;
  /** How many megapixelsteps this Horde generated in the last minute */
  past_minute_megapixelsteps?: number;
  /** The amount of image interrogations waiting and processing currently in this Horde */
  queued_forms?: number;
  /** How many workers are actively processing image interrogations in this Horde in the past 5 minutes */
  interrogator_count?: number;
  /** How many worker threads are actively processing image interrogation in this Horde in the past 5 minutes */
  interrogator_thread_count?: number;
  /** The amount of tokens in waiting and processing requests currently in this Horde */
  queued_tokens?: number;
  /** How many tokens this Horde generated in the last minute */
  past_minute_tokens?: number;
}

export type ActiveModel = ActiveModelLite & {
  /** The average speed of generation for this model */
  performance?: number;
  /** The amount waiting to be generated by this model */
  queued?: number;
  /** Estimated time in seconds for this model's queue to be cleared */
  eta?: number;
  /**
   * The model type (text or image)
   * @example image
   */
  type?: "image" | "text";
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

export type TeamDetails = TeamDetailsLite & {
  /**
   * Extra information or comments about this team provided by its owner.
   * @example Anarchy is emergent order.
   */
  info?: string;
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
  creator?: string;
  /**
   * How many workers have been dedicated to this team
   * @example 10
   */
  worker_count?: number;
  workers?: WorkerDetailsLite[];
  models?: ActiveModelLite[];
};

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

export interface DeleteTimeoutIPInput {
  /**
   * The IP address to remove from timeout
   * @example 127.0.0.1
   */
  ipaddr: string;
}

export interface SimpleResponse {
  /** The result of this operation */
  message: string;
}

export interface ModelInterrogationInputStable {
  forms?: ModelInterrogationFormStable[];
  /** The public URL of the image to interrogate */
  source_image?: string;
}

export interface ModelInterrogationFormStable {
  /**
   * The type of interrogation this is
   * @example caption
   */
  name:
    | "caption"
    | "interrogation"
    | "nsfw"
    | "GFPGAN"
    | "RealESRGAN_x4plus"
    | "RealESRGAN_x4plus_anime_6B"
    | "NMKD_Siax"
    | "4x_AnimeSharp"
    | "CodeFormers"
    | "strip_background";
  payload?: ModelInterrogationFormPayloadStable;
}

export interface ModelInterrogationFormPayloadStable {
  "*"?: Record<string, string>;
}

export interface RequestInterrogationResponse {
  /** The UUID of the request. Use this to retrieve the request status in the future */
  id?: string;
  /** Any extra information from the horde about this request */
  message?: string;
}

export interface InterrogationStatus {
  /**
   * Interrogation State
   * The overall status of this interrogation
   */
  state?: string;
  forms?: InterrogationFormStatus[];
}

export interface InterrogationFormStatus {
  /** The name of this interrogation form */
  form?: string;
  /**
   * Interrogation State
   * The overall status of this interrogation
   */
  state?: string;
  result?: InterrogationFormResult;
}

export interface InterrogationFormResult {
  "*"?: Record<string, object>;
}

export interface InterrogationPopInput {
  /** The Name of the Worker */
  name?: string;
  priority_usernames?: string[];
  forms?: (
    | "caption"
    | "interrogation"
    | "nsfw"
    | "GFPGAN"
    | "RealESRGAN_x4plus"
    | "RealESRGAN_x4plus_anime_6B"
    | "NMKD_Siax"
    | "4x_AnimeSharp"
    | "CodeFormers"
    | "strip_background"
  )[];
  /** The amount of forms to pop at the same time */
  amount?: number;
  /** The version of the bridge used by this worker */
  bridge_version?: number;
  /**
   * The worker name, version and website
   * @example AI Horde Worker:11:https://github.com/db0/AI-Horde-Worker
   */
  bridge_agent?: string;
  /**
   * How many threads this worker is running. This is used to accurately the current power available in the horde
   * @min 1
   * @max 100
   */
  threads?: number;
  /**
   * The maximum amount of 512x512 tiles this worker can post-process
   * @min 1
   * @max 256
   */
  max_tiles?: number;
}

export interface InterrogationPopPayload {
  forms?: InterrogationPopFormPayload[];
  skipped?: NoValidInterrogationsFound;
}

export interface InterrogationPopFormPayload {
  /** The UUID of the interrogation form. Use this to post the results in the future */
  id?: string;
  /**
   * The name of this interrogation form
   * @example caption
   */
  form?:
    | "caption"
    | "interrogation"
    | "nsfw"
    | "GFPGAN"
    | "RealESRGAN_x4plus"
    | "RealESRGAN_x4plus_anime_6B"
    | "NMKD_Siax"
    | "4x_AnimeSharp"
    | "CodeFormers"
    | "strip_background";
  payload?: ModelInterrogationFormPayloadStable;
  /** The URL From which the source image can be downloaded. */
  source_image?: string;
  /** The URL in which the post-processed image can be uploaded. */
  r2_upload?: string;
}

export interface NoValidInterrogationsFound {
  /**
   * How many waiting requests were skipped because they demanded a specific worker
   * @min 0
   */
  worker_id?: number;
  /**
   * How many waiting requests were skipped because they demanded a trusted worker which this worker is not.
   * @min 0
   */
  untrusted?: number;
  /**
   * How many waiting requests were skipped because they require a higher version of the bridge than this worker is running (upgrade if you see this in your skipped list).
   * @min 0
   * @example 0
   */
  bridge_version?: number;
}

export interface PutNewFilter {
  /**
   * The regex for this filter.
   * @example ac.*
   */
  regex: string;
  /**
   * The integer defining this filter type
   * @min 10
   * @max 29
   * @example 10
   */
  filter_type: number;
  /** Description about this regex */
  description?: string;
  /** The replacement string for this regex */
  replacement?: string;
}

export interface FilterDetails {
  /** The UUID of this filter. */
  id: string;
  /**
   * The regex for this filter.
   * @example ac.*
   */
  regex: string;
  /**
   * The integer defining this filter type
   * @min 10
   * @max 29
   * @example 10
   */
  filter_type: number;
  /** Description about this regex */
  description?: string;
  /** The replacement string for this regex. */
  replacement?: string;
  /** The moderator which added or last updated this regex */
  user: string;
}

export interface FilterPromptSuspicion {
  /** Rates how suspicious the provided prompt is. A suspicion over 2 means it would be blocked. */
  suspicion: string;
  matches?: string[];
}

export interface FilterRegex {
  /**
   * The integer defining this filter type
   * @min 10
   * @max 29
   * @example 10
   */
  filter_type: number;
  /** The full regex for this filter type. */
  regex: string;
}

export interface PatchExistingFilter {
  /**
   * The regex for this filter.
   * @example ac.*
   */
  regex?: string;
  /**
   * The integer defining this filter type
   * @min 10
   * @max 29
   * @example 10
   */
  filter_type?: number;
  /** Description about this regex */
  description?: string;
  /** The replacement string for this regex */
  replacement?: string;
}

export interface StatsImgTotals {
  minute?: SinglePeriodImgStat;
  hour?: SinglePeriodImgStat;
  day?: SinglePeriodImgStat;
  month?: SinglePeriodImgStat;
  total?: SinglePeriodImgStat;
}

export interface SinglePeriodImgStat {
  /** The amount of text requests generated during this period. */
  requests?: number;
  /** The amount of tokens generated during this period. */
  tokens?: number;
}

export interface ImgModelStats {
  day?: SinglePeriodImgModelStats;
  month?: SinglePeriodImgModelStats;
  total?: SinglePeriodImgModelStats;
}

export interface SinglePeriodImgModelStats {
  "*"?: Record<string, number>;
}

export interface StatsTxtTotals {
  minute?: SinglePeriodImgStat;
  hour?: SinglePeriodImgStat;
  day?: SinglePeriodImgStat;
  month?: SinglePeriodImgStat;
  total?: SinglePeriodImgStat;
}

export interface TxtModelStats {
  day?: SinglePeriodTxtModelStats;
  month?: SinglePeriodTxtModelStats;
  total?: SinglePeriodTxtModelStats;
}

export interface SinglePeriodTxtModelStats {
  "*"?: Record<string, number>;
}
