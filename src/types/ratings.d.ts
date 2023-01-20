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

export interface DatasetsGetResponse {
  /**
   * The unique identifier for this dataset
   * @example 00000000-0000-0000-0000-000000000000
   */
  id?: string;
  /**
   * The name of this dataset
   * @example My Dataset
   */
  name?: string;
  /**
   * The description of this dataset
   * @example This is a dataset of images of cats.
   */
  description?: string;
  /**
   * The number of images in this dataset
   * @example 100
   */
  image_count?: number;
}

export interface RequestError {
  /** The error message for this status code. */
  message?: string;
}

export interface RatePostInput {
  /**
   * The aesthetic rating for this image. How much do you like this image subjectively and in isolation from comparison with other images or with its own prompt.
   * @min 1
   * @max 10
   * @example 5
   */
  rating?: number;
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

export interface RatePostResponse {
  /**
   * Any extra information about the submitted rating
   * @example Rating submittted
   */
  message?: string;
  /**
   * The amount of kudos awarded for this rating
   * @min 1
   * @example 5
   */
  reward?: number;
}

export interface DatasetImagePopResponse {
  /**
   * The UUID of the image to rate
   * @example 00000000-0000-0000-0000-000000000000
   */
  id?: string;
  /**
   * The URL from which to download the image
   * @example https://cdn.droom.cloud/00000000-0000-0000-0000-000000000000.webp
   */
  url?: string;
  /**
   * The UUID of the dataset in which this image belongs
   * @example 00000000-0000-0000-0000-000000000000
   */
  dataset_id?: string;
}

export interface TeamsGetResponse {
  /**
   * The unique identifier for this team
   * @example 00000000-0000-0000-0000-000000000000
   */
  id?: string;
  /**
   * The name of this team
   * @example My Team
   */
  team_name?: string;
  /**
   * Whether this team is private or not
   * @example false
   */
  is_private?: boolean;
}
