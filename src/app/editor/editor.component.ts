import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ContentsItemType, Course, DurationUnit } from '../models';
import { DataService } from '../services/data/data.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  id: string;
  courses$ = this.dataService.courses$;
  courseSub: Subscription;
  formCourse: FormGroup;
  formSub: Subscription;
  fb = new FormBuilder;
  contentsItemTypes = ContentsItemType;
  durationUnit = DurationUnit;

  constructor(
    private readonly dataService:DataService,
    private readonly activatedRoute: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    this.courseSub = combineLatest([this.activatedRoute.params, this.courses$]).subscribe({
      next: ([params, courses]) => {
        const currentCourse = courses.find(course => course.id === params['id']);
        if (currentCourse) {
          this.createForm(currentCourse);
          this.id = params['id'];
        }
      }
    })
  }

  ngOnDestroy(): void {
    if (this.formSub) {
      this.formSub.unsubscribe();
      this.courseSub.unsubscribe();
    }      
  }

  createForm(course: Course) {
    console.log(course);
    const { name, description, author, contents, plans, sales, coauthors, duration } = course

    this.formCourse = this.fb.group({
      name,
      description,
      author: this.fb.group({firstName: author.firstName, lastName: author.lastName}),
      sales: this.fb.group({
        startDate: sales?.start?.toISOString().substring(0, 10) || null,
        startTime: sales?.start?.toLocaleTimeString() || null,
        endDate: sales?.end?.toISOString().substring(0, 10) || null,
        endTime: sales?.end?.toLocaleTimeString() || null,
      }),      
      plans: this.fb.array(plans.map(({name, price, advantages}) => this.fb.group({
        name, price, advantages: this.fb.array(advantages?.length ? (advantages.map(({ available, title }) => {
          return this.fb.group({ available, title })
        })) : [])
      }))),
      contents: this.fb.array(contents.length ? contents.map(({ type, duration, name }) => this.fb.group({
        type,
        duration: this.fb.group({
          unit: duration?.unit || '',
          value: duration?.value || '',
        }),        
        name
      })) : []),
      duration: this.fb.group({
        unit: duration?.unit || '',
        value: duration?.value || '',
      }), 
      coauthors: this.fb.array(coauthors?.length ? coauthors.map(({ firstName, lastName }) => this.fb.group({
        firstName, lastName
      })) : [])
    });

    this.formSub = this.formCourse.valueChanges
      .pipe(debounceTime(1000))
      .subscribe({
        next: () => this.updateCourse()
      });
  }

  getPlans(): FormArray {
    return this.formCourse?.controls['plans'] as FormArray
  }

  addPlans(): void {
    this.getPlans().push(this.fb.group({
      name: '',
      price: 0,
      advantages: this.fb.array([this.fb.group({
        available: false,
        title: ''
      })])
    }))
  }

  addAdvantages(i: number): void {
    const currentPlan = this.getPlans().controls[i] as FormGroup;
    const advantages = currentPlan.controls['advantages'] as FormArray;
    advantages.push(this.fb.group({
      available: false,
      title: ''
    }));
  }

  getContents(): FormArray {
    return this.formCourse?.controls['contents'] as FormArray
  }

  addContents(): void {
    this.getContents().push(this.fb.group({
      type: ContentsItemType.lesson,
      durationUnit: DurationUnit.day,
      durationValue: 0,
      name: ''
    }))
  }

  getCoauthors(): FormArray {
    return this.formCourse?.controls['coauthors'] as FormArray
  }

  addCoauthors(): void {
    this.getCoauthors().push(this.fb.group({ firstName: '', lastName: '' }));
  }

  updateCourse(): void {
    const { sales } = this.formCourse.value;

    const updatedCourse: Course = {
      id: this.id,
      ...this.formCourse.value,
      sales: {
        start: this.convertDate(sales.startDate, sales.startTime),
        end: this.convertDate(sales.endDate, sales.endTime)
      }
    }
    this.dataService.updateCourse(this.id, updatedCourse);    
  }

  convertDate(yearMonthDay: string, time: string): Date {
    const dateArray = yearMonthDay.split('-');
    const timeArray = time.split(':');
    const year = +dateArray[0];
    const month = +dateArray[1];
    const date = +dateArray[2];
    const hours = +timeArray[0];
    const minutes = +timeArray[1];

    return new Date(year, month, date, hours, minutes);
  }
  

}
