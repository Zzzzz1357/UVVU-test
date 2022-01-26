import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ContentsItemType, Course, DurationUnit } from '../../models';
import { randomString } from '../../utils/random-string.function';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() {
    this.createCourse({
      name: "Test course #1",
      author: {
        firstName: "John",
        lastName: "Doe"
      },
      contents: [
        { name: "First lesson", type: ContentsItemType.lesson },
        { name: "Second lesson", type: ContentsItemType.lesson },
        { name: "first stream", type: ContentsItemType.stream },
      ],
      plans: [
        {
          name: "Free",
          price: 0,
          advantages: [
            {
              available: true,
              title: "First Advantage"
            },
            {
              available: false,
              title: "Second advantage"
            },
          ],
        },
      ],
      duration: { value: 1, unit: DurationUnit.day },
      sales: {
        start: new Date(2021, 9, 24, 12, 20),
        end: new Date(2021, 11, 25, 7, 35),
      },
    });
  }

  private _courses: Map<string, Course> = new Map();
  private _courses$: ReplaySubject<Map<string, Course>> = new ReplaySubject(1);

  /**
   * Courses
   * @type {Observable<Course[]>}
   */
  get courses$(): Observable<Course[]> {
    return this._courses$.pipe(map(courses => Array.from(courses.values())));
  }

  /**
   * Create new course
   * @param {Partial<Course>} data course data
   * @returns {string} genarated id
   */
  async createCourse(data: Partial<Course>): Promise<string> {
    const id = randomString();
    this._courses.set(id, <Course>{ ...data, id });
    this._courses$.next(this._courses);
    await new Promise(r => setTimeout(r, (Math.random() * 1000) + 1000));
    return id;
  }

  /**
   * Update exist course
   * @param {string} id course Id
   * @param {Partial<Course>} data course data
   * @returns {void}
   */
  async updateCourse(id: string, data: Partial<Course>): Promise<void> {
    const existCourse = this._courses.get(id);
    if (!existCourse) {
      throw new Error('Course not found');
    }
    this._courses.set(id, { ...existCourse, ...data });
    this._courses$.next(this._courses);
    return new Promise<void>(r => setTimeout(r, (Math.random() * 1000) + 1000));
  }
}
